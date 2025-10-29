import React, { useEffect, useState } from "react";
import axios from "axios";
import NavBotonera from "../components/NavBotonera";

const API = "http://localhost:8080/api";

// Helpers
const toInput = (iso) => {
  if (!iso) return "";
  return iso.length >= 16 ? iso.slice(0, 16) : iso;
};
const toIsoLocal = (val) => (val ? val.slice(0, 16) : "");

// 💰 Calcula el precio total
const calcularPrecio = (r) => {
  const precioHora =
    r.precioHora ??
    r.pistaPrecioHora ??
    r.pistaPrecio ??
    r.precio ??
    null;

  if (!precioHora || !r.fechaHoraInicio || !r.fechaHoraFin) return null;

  const ms = new Date(r.fechaHoraFin) - new Date(r.fechaHoraInicio);
  const horas = ms / 3600000;
  if (horas <= 0) return null;

  const total = +(precioHora * horas).toFixed(2);
  return { precioHora, horas, total };
};

// "YYYY-MM-DDTHH:mm" de ahora (sin segundos) para min de los inputs
const nowMinInput = (() => {
  const n = new Date();
  n.setSeconds(0, 0);
  const pad = (x) => String(x).padStart(2, "0");
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}T${pad(n.getHours())}:${pad(n.getMinutes())}`;
})();

export default function MisReservaPage() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // { id, pistaId, inicio, fin, nombre, apellidos, telefono }
  const [editing, setEditing] = useState(null);
  const [confirmData, setConfirmData] = useState(null);

  const token = localStorage.getItem("token");
  const authHeaders = { Authorization: `Bearer ${token}` };

  const cargarMisReservas = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/reservas/mias`, {
        headers: authHeaders,
      });
      setReservas(data || []);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data ?? "No se pudieron cargar las reservas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMisReservas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === Edición ===
  const startEdit = (r) => {
    setEditing({
      id: r.id,
      pistaId: r.pistaId,
      inicio: toInput(r.fechaHoraInicio),
      fin: toInput(r.fechaHoraFin),
      // datos de contacto actuales
      nombre: r.nombre ?? r.clienteNombre ?? r.userNombre ?? "",
      apellidos: r.apellidos ?? r.clienteApellidos ?? r.userApellidos ?? "",
      telefono: r.telefono ?? r.clienteTelefono ?? r.userTelefono ?? "",
    });
  };
  const cancelEdit = () => setEditing(null);

  const saveEdit = async () => {
    if (!editing) return;

    // ❌ no permitir horas pasadas (comparando con AHORA)
    const now = new Date();
    if (new Date(editing.inicio) < now) {
      alert("No puedes mover una reserva a un horario pasado (anterior a ahora).");
      return;
    }

    // Duración mínima y coherencia
    const mins = Math.round((new Date(editing.fin) - new Date(editing.inicio)) / 60000);
    if (mins < 30) {
      alert("La duración mínima es de 30 minutos.");
      return;
    }
    if (mins % 30 !== 0) {
      alert("La duración debe ser en múltiplos de 30 minutos (:00 o :30).");
      return;
    }

    // Validación simple de contacto (opcional)
    if (!editing.nombre?.trim() || !editing.apellidos?.trim() || !editing.telefono?.trim()) {
      alert("Nombre, apellidos y teléfono no pueden estar vacíos.");
      return;
    }

    const payload = {
      pistaId: editing.pistaId,
      fechaHoraInicio: toIsoLocal(editing.inicio),
      fechaHoraFin: toIsoLocal(editing.fin),
      // 👇 ahora enviamos también contacto (el backend ya lo admite)
      nombre: editing.nombre,
      apellidos: editing.apellidos,
      telefono: editing.telefono,
    };

    setConfirmData({
      text: "¿Estás seguro de modificar la reserva?",
      onAccept: async () => {
        setSaving(true);
        try {
          await axios.put(`${API}/reservas/${editing.id}`, payload, {
            headers: authHeaders,
          });
          setEditing(null);
          await cargarMisReservas();
        } catch (err) {
          console.error(err);
          const msg =
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.response?.data ||
            err?.message ||
            "No se pudo modificar la reserva";
          alert(msg);
        } finally {
          setSaving(false);
          setConfirmData(null);
        }
      },
      onCancel: () => setConfirmData(null),
    });
  };

  // === Cancelar / Borrar ===
  const cancelarReserva = async (id) => {
    setConfirmData({
      text: "¿Quieres cancelar esta reserva?",
      onAccept: async () => {
        try {
          await axios.delete(`${API}/reservas/${id}`, { headers: authHeaders });
          await cargarMisReservas();
        } catch (err) {
          console.error(err);
          alert(err?.response?.data ?? "No se pudo cancelar la reserva");
        } finally {
          setConfirmData(null);
        }
      },
      onCancel: () => setConfirmData(null),
    });
  };

  const borrarReserva = async (id) => {
    setConfirmData({
      text: "¿Eliminar definitivamente la reserva CANCELADA?",
      onAccept: async () => {
        try {
          await axios.delete(`${API}/reservas/${id}/hard`, {
            headers: authHeaders,
          });
          await cargarMisReservas();
        } catch (err) {
          console.error(err);
          alert(err?.response?.data ?? "No se pudo eliminar la reserva");
        } finally {
          setConfirmData(null);
        }
      },
      onCancel: () => setConfirmData(null),
    });
  };

  return (
    <div className="container" style={{ maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ margin: "32px 0" }}>Mis reservas</h1>

      {loading && <p>Cargando...</p>}
      {!loading && reservas.length === 0 && <p>No tienes reservas.</p>}

      {!loading &&
        reservas.map((r) => {
          const isEditing = editing?.id === r.id;
          const esCancelada = (r.estado || "").toUpperCase() === "CANCELADA";
          const esConfirmada = (r.estado || "").toUpperCase() === "CONFIRMADA";

          // Datos de contacto guardados (para visualización)
          const nombre = r.nombre ?? r.clienteNombre ?? r.userNombre ?? "";
          const apellidos = r.apellidos ?? r.clienteApellidos ?? r.userApellidos ?? "";
          const telefono = r.telefono ?? r.clienteTelefono ?? r.userTelefono ?? "";

          // 💰 Precio calculado (si tenemos precio/hora en el DTO)
          const precio = calcularPrecio(r);

          return (
            <div
              key={r.id}
              style={{
                padding: 20,
                marginBottom: 16,
                borderRadius: 10,
                background: "#f8f8f8",
                border: "1px solid #eee",
                position: "relative",
              }}
            >
              {/* Cabecera */}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {r.pistaNombre} — {r.pistaTipo}
                </div>

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontWeight: 700,
                      color: esConfirmada ? "#0a6a4a" : esCancelada ? "#b00020" : "#555",
                    }}
                  >
                    Estado: {r.estado}
                  </div>

                  {/* 💶 Precio total debajo del estado */}
                  {precio && (
                    <div style={{ marginTop: 4, color: "#333" }}>
                      💶 <strong>Precio total:</strong> {precio.total} €
                      <span style={{ color: "#777" }}>
                        {" "}
                        ({precio.precioHora} €/h · {precio.horas.toFixed(2)} h)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 12, color: "#333" }}>
                <div>Club: {r.clubNombre}</div>
                {(nombre || apellidos || telefono) && (
                  <div style={{ marginTop: 4, fontSize: 14, color: "#444" }}>
                    <strong>Reserva a nombre de:</strong>{" "}
                    {nombre} {apellidos} {telefono && `— ${telefono}`}
                  </div>
                )}
              </div>

              {/* Cuerpo */}
              {!isEditing ? (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <strong>Inicio:</strong> {r.fechaHoraInicio}{" "}
                    <strong style={{ marginLeft: 12 }}>Fin:</strong>{" "}
                    {r.fechaHoraFin}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    {esConfirmada && (
                      <>
                        <button type="button" onClick={() => startEdit(r)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelarReserva(r.id)}
                          style={{ background: "#fbe3e4", color: "#8a1c1c" }}
                        >
                          Cancelar
                        </button>
                      </>
                    )}

                    {esCancelada && (
                      <button
                        type="button"
                        onClick={() => borrarReserva(r.id)}
                        style={{ background: "#ffecec", color: "#b00020" }}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </>
              ) : (
                // === Modo edición ===
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto 1fr",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <label style={{ fontWeight: 600 }}>Inicio</label>
                  <input
                    type="datetime-local"
                    min={nowMinInput}   // 👈 no deja elegir horas pasadas desde YA
                    value={editing.inicio}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p, inicio: e.target.value }))
                    }
                  />

                  <label style={{ fontWeight: 600 }}>Fin</label>
                  <input
                    type="datetime-local"
                    min={nowMinInput}   // 👈 idem para fin
                    value={editing.fin}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p, fin: e.target.value }))
                    }
                  />

                  <label style={{ fontWeight: 600 }}>Nombre</label>
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={editing.nombre}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p, nombre: e.target.value }))
                    }
                  />

                  <label style={{ fontWeight: 600 }}>Apellidos</label>
                  <input
                    type="text"
                    placeholder="Tus apellidos"
                    value={editing.apellidos}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p, apellidos: e.target.value }))
                    }
                  />

                  <label style={{ fontWeight: 600 }}>Teléfono</label>
                  <input
                    type="tel"
                    placeholder="600123123"
                    value={editing.telefono}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p, telefono: e.target.value }))
                    }
                  />

                  <div style={{ gridColumn: "1 / span 4", marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={saving}
                      style={{ marginRight: 8 }}
                    >
                      Guardar
                    </button>
                    <button type="button" onClick={cancelEdit} disabled={saving}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

      {/* Modal de confirmación */}
      {confirmData && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 12,
              padding: 20,
              minWidth: 360,
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Confirmar</h3>
            <p style={{ marginTop: 6 }}>{confirmData.text}</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={confirmData.onCancel ?? (() => setConfirmData(null))}>
                Cancelar
              </button>
              <button
                style={{ background: "#d9f2e7", color: "#0a6a4a" }}
                onClick={confirmData.onAccept}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      <NavBotonera />
    </div>
  );
}
