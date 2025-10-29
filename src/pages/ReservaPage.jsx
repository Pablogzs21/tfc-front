import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import MapClub from "../components/MapClub";
import { useNavigate } from "react-router-dom";
import NavBotonera from "../components/NavBotonera";

const API = "http://localhost:8080/api";
const MIS_RESERVAS_PATH = "/mis-reservas";

// ===== Configurables =====
const CLUB_OPEN_HH = 8;   // 08:00
const CLUB_CLOSE_HH = 23; // 23:00

// ===== Helpers fecha/hora =====
const toInput = (iso) => {
  if (!iso) return "";
  return iso.length >= 16 ? iso.slice(0, 16) : iso; // "YYYY-MM-DDTHH:mm"
};
const toIsoLocal = (val) => (val ? val.slice(0, 16) : "");
const roundToNext30 = (d = new Date()) => {
  const r = new Date(d);
  r.setSeconds(0, 0);
  const mins = r.getMinutes();
  const add = mins % 30 === 0 ? 0 : 30 - (mins % 30);
  r.setMinutes(mins + add);
  return r;
};
const diffMinutes = (a, b) => {
  if (!a || !b) return 0;
  const ms = new Date(b) - new Date(a);
  return Math.round(ms / 60000);
};
const isWithinClubHours = (isoLocal) => {
  const d = new Date(isoLocal);
  const startDay = new Date(d);
  startDay.setHours(CLUB_OPEN_HH, 0, 0, 0);
  const endDay = new Date(d);
  endDay.setHours(CLUB_CLOSE_HH, 0, 0, 0);
  return d >= startDay && d <= endDay;
};
const is30Step = (isoLocal) => {
  const d = new Date(isoLocal);
  return d.getMinutes() % 30 === 0;
};

// "YYYY-MM-DDTHH:mm" de AHORA (sin segundos) para min de los inputs
const nowMinInput = (() => {
  const n = new Date();
  n.setSeconds(0, 0);
  const pad = (x) => String(x).padStart(2, "0");
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}T${pad(n.getHours())}:${pad(n.getMinutes())}`;
})();

export default function ReservaPage() {
  const navigate = useNavigate();

  // Datos
  const [pistas, setPistas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroClub, setFiltroClub] = useState("Todos");

  // Mapa: ahora controlamos por tarjeta (pista.id), no por clubId
  const [openMapFor, setOpenMapFor] = useState(null);
  const toggleMap = (itemKey) =>
    setOpenMapFor((prev) => (prev === itemKey ? null : itemKey));

  // Formulario de reserva inline
  const [openFormFor, setOpenFormFor] = useState(null); // pistaId
  const [form, setForm] = useState({
    inicio: "",
    fin: "",
    nombre: "",
    apellidos: "",
    telefono: "",
  });
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // Cargar pistas
  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await axios.get(`${API}/pistas`, {
          headers: authHeaders,
        });
        setPistas(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setError(
          e?.response?.data?.message ||
            e?.response?.data ||
            e?.message ||
            "No se pudieron cargar las pistas"
        );
      } finally {
        setLoading(false);
      }
    };
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Opciones de filtro
  const opcionesTipo = useMemo(() => {
    const set = new Set(pistas.map((p) => p.tipo).filter(Boolean));
    return ["Todos", ...Array.from(set)];
  }, [pistas]);

  const opcionesClub = useMemo(() => {
    const set = new Set(
      pistas.map((p) => p.clubNombre ?? p.club?.nombre).filter(Boolean)
    );
    return ["Todos", ...Array.from(set)];
  }, [pistas]);

  // Aplicar filtros
  const pistasFiltradas = useMemo(() => {
    return pistas.filter((p) => {
      const tipoOK = filtroTipo === "Todos" || (p.tipo || "") === filtroTipo;
      const clubNom = p.clubNombre ?? p.club?.nombre ?? "";
      const clubOK = filtroClub === "Todos" || clubNom === filtroClub;
      return tipoOK && clubOK;
    });
  }, [pistas, filtroTipo, filtroClub]);

  const limpiarFiltros = () => {
    setFiltroTipo("Todos");
    setFiltroClub("Todos");
  };

  // ---- util para convertir a número fiable (coma -> punto) ----
  const toNum = (v) => {
    if (v == null) return null;
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    if (typeof v === "string") {
      const s = v.replace(",", ".").trim();
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  // Normaliza metadatos del club/pista (coords robustas)
  const getClubMeta = (p) => {
    const clubId = p.clubId ?? p.club?.id ?? p.id;
    const clubNombre = p.clubNombre ?? p.club?.nombre ?? "Club";
    const direccion = p.clubDireccion ?? p.club?.direccion ?? "";
    const lat = toNum(p.lat ?? p.clubLat ?? p.club?.lat ?? null);
    const lng = toNum(p.lng ?? p.clubLng ?? p.club?.lng ?? null);
    const nombrePista = p.nombre ?? p.pistaNombre ?? "Pista";
    const tipoPista = p.tipo ?? p.pistaTipo ?? "";
    const precio = p.precio ?? p.precioHora ?? p.tarifa ?? p.precioPorHora ?? null; // €/h
    return { clubId, clubNombre, direccion, lat, lng, nombrePista, tipoPista, precio };
  };

  // Abre formulario precargado con 1h (redondeado al siguiente :00/:30)
  const abrirFormulario = (pistaId) => {
    const abrimos = openFormFor !== pistaId;
    setOpenFormFor(abrimos ? pistaId : null);

    if (abrimos) {
      const start = roundToNext30();
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const toIsoNoSeconds = (d) => d.toISOString().slice(0, 16);
      setForm({
        inicio: toInput(toIsoNoSeconds(start)),
        fin: toInput(toIsoNoSeconds(end)),
        nombre: "",
        apellidos: "",
        telefono: "",
      });
    } else {
      setForm({ inicio: "", fin: "", nombre: "", apellidos: "", telefono: "" });
    }
  };

  // Precio calculado en función de la duración
  const calcularTotal = (precioHora) => {
    if (!precioHora || !form.inicio || !form.fin) return null;
    const mins = diffMinutes(form.inicio, form.fin);
    if (mins <= 0) return null;
    const horas = mins / 60;
    return +(precioHora * horas).toFixed(2);
  };

  // Validaciones (incluye: no horas pasadas)
  const validarFormulario = () => {
    const { inicio, fin, nombre, apellidos, telefono } = form;

    if (!inicio || !fin) return "Indica inicio y fin de la reserva.";
    if (!nombre.trim() || !apellidos.trim() || !telefono.trim())
      return "Rellena nombre, apellidos y teléfono.";

    // nada de horas pasadas respecto a AHORA
    const now = new Date();
    if (new Date(inicio) < now) {
      return "No puedes reservar en un horario pasado (anterior a ahora).";
    }

    // mínimo 30 minutos
    const mins = diffMinutes(inicio, fin);
    if (mins < 30) return "La duración mínima es de 30 minutos.";
    if (mins % 30 !== 0) return "La duración debe ser en múltiplos de 30 minutos.";

    // pasos de 30 en cada input
    if (!is30Step(inicio) || !is30Step(fin))
      return "Las horas deben ser exactas en :00 o :30.";

    // horario del club
    if (!isWithinClubHours(inicio) || !isWithinClubHours(fin))
      return `El club está cerrado a esa hora. Horario: ${String(CLUB_OPEN_HH).padStart(2, "0")}:00–${String(CLUB_CLOSE_HH).padStart(2, "0")}:00.`;

    // mismo día (opcional)
    const di = new Date(inicio); di.setHours(0,0,0,0);
    const df = new Date(fin);    df.setHours(0,0,0,0);
    if (
      di.getFullYear() !== df.getFullYear() ||
      di.getMonth() !== df.getMonth() ||
      di.getDate() !== df.getDate()
    ) {
      return "La reserva debe comenzar y finalizar el mismo día.";
    }

    return null;
  };

  // Confirmar reserva (POST)
  const confirmarReserva = async (pistaId) => {
    const errorMsg = validarFormulario();
    if (errorMsg) {
      alert(errorMsg);
      return;
    }

    const payload = {
      pistaId,
      fechaHoraInicio: toIsoLocal(form.inicio),
      fechaHoraFin: toIsoLocal(form.fin),
      nombre: form.nombre,
      apellidos: form.apellidos,
      telefono: form.telefono,
    };

    setSaving(true);
    try {
      await axios.post(`${API}/reservas`, payload, { headers: authHeaders });
      navigate(MIS_RESERVAS_PATH);
      return;
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "No se pudo crear la reserva";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ margin: "24px 0", display: "flex", gap: 8, alignItems: "center" }}>
        <span role="img" aria-label="pala">🎾</span> Reservar Pistas
      </h1>

      {/* Filtros */}
      <div
        style={{
          background: "#fafafa",
          border: "1px solid #eee",
          padding: 16,
          borderRadius: 12,
          marginBottom: 16,
          display: "grid",
          gridTemplateColumns: "1fr 1fr auto auto",
          gap: 12,
          alignItems: "end",
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#666" }}>Tipo</label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          >
            {opcionesTipo.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, color: "#666" }}>Club</label>
          <select
            value={filtroClub}
            onChange={(e) => setFiltroClub(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          >
            {opcionesClub.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {}}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #ddd" }}
          title="El filtrado es automático"
        >
          Filtrar
        </button>
        <button
          onClick={limpiarFiltros}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #ddd" }}
        >
          Limpiar
        </button>
      </div>

      {/* Estados */}
      {loading && <p>Cargando pistas...</p>}
      {!loading && error && (
        <div style={{ background: "#ffecec", color: "#b00020", padding: 12, borderRadius: 8 }}>
          {error}
        </div>
      )}
      {!loading && !error && pistasFiltradas.length === 0 && (
        <p>No hay pistas que coincidan con el filtro.</p>
      )}

      {/* Listado */}
      {!loading &&
        !error &&
        pistasFiltradas.map((pista) => {
          const {
            clubNombre,
            direccion,
            lat,
            lng,
            nombrePista,
            tipoPista,
            precio,
          } = getClubMeta(pista);

          const itemKey = pista.id; // 👈 clave única por tarjeta
          const formAbierto = openFormFor === pista.id;
          const total = calcularTotal(precio);

          return (
            <div
              key={pista.id}
              style={{
                padding: 20,
                marginBottom: 16,
                borderRadius: 12,
                background: "white",
                border: "1px solid #eee",
              }}
            >
              <h3 style={{ margin: 0 }}>
                {nombrePista} — <span style={{ color: "#666" }}>{tipoPista}</span>
              </h3>
              <p style={{ margin: "8px 0 0" }}>
                Precio: {precio != null ? `${precio} €/h` : "— €/h"}
              </p>
              <p style={{ margin: "4px 0 12px", color: "#555" }}>
                Club: {clubNombre}
              </p>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => toggleMap(itemKey)}>
                  {openMapFor === itemKey ? "Ocultar mapa" : "Ver mapa"}
                </button>

                <button
                  onClick={() => abrirFormulario(pista.id)}
                  style={{
                    background: "#6433a8",
                    color: "white",
                    borderRadius: 8,
                    padding: "8px 14px",
                    border: 0,
                  }}
                >
                  {formAbierto ? "Cerrar" : "Reservar"}
                </button>
              </div>

              {/* Mapa */}
              {openMapFor === itemKey && (
                <div style={{ marginTop: 12 }}>
                  <MapClub
                    lat={lat}
                    lng={lng}
                    nombre={clubNombre}
                    direccion={direccion}
                    height={300}
                  />
                  {Number.isFinite(lat) && Number.isFinite(lng) && (
                    <div style={{ marginTop: 8 }}>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Cómo llegar
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Formulario de reserva */}
              {formAbierto && (
                <div
                  style={{
                    marginTop: 12,
                    background: "#fafafa",
                    border: "1px solid #eee",
                    borderRadius: 10,
                    padding: 12,
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto 1fr",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <label style={{ fontWeight: 600 }}>Inicio</label>
                  <input
                    type="datetime-local"
                    min={nowMinInput}   // 👈 bloquea horas pasadas desde YA
                    value={form.inicio}
                    onChange={(e) => setForm((f) => ({ ...f, inicio: e.target.value }))}
                  />
                  <label style={{ fontWeight: 600 }}>Fin</label>
                  <input
                    type="datetime-local"
                    min={nowMinInput}   // 👈 bloquea horas pasadas desde YA
                    value={form.fin}
                    onChange={(e) => setForm((f) => ({ ...f, fin: e.target.value }))}
                  />

                  <label style={{ fontWeight: 600 }}>Nombre</label>
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={form.nombre}
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  />

                  <label style={{ fontWeight: 600 }}>Apellidos</label>
                  <input
                    type="text"
                    placeholder="Tus apellidos"
                    value={form.apellidos}
                    onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))}
                  />

                  <label style={{ fontWeight: 600 }}>Teléfono</label>
                  <input
                    type="tel"
                    placeholder="600123123"
                    value={form.telefono}
                    onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                  />

                  {/* Precio calculado */}
                  <div style={{ gridColumn: "1 / span 4", marginTop: 8 }}>
                    <strong>
                      {total != null ? `Total estimado: ${total} €` : "Selecciona horas para ver el total"}
                    </strong>
                  </div>

                  <div style={{ gridColumn: "1 / span 4", marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => confirmarReserva(pista.id)}
                      disabled={saving}
                      style={{ marginRight: 8 }}
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenFormFor(null);
                        setForm({ inicio: "", fin: "", nombre: "", apellidos: "", telefono: "" });
                      }}
                      disabled={saving}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

      {/* Botonera inferior */}
      <NavBotonera
        items={[
          { label: "Área Usuario", path: "/user" },
          { label: "Área Admin", path: "/admin" },
          { label: "Mis reservas", path: "/mis-reservas" },
        ]}
      />
    </div>
  );
}