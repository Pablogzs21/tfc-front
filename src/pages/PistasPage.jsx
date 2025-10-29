import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function PistasPage() {
  const navigate = useNavigate();

  const [pistas, setPistas] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [tipo, setTipo] = useState("");     // "", "Indoor", "Outdoor"
  const [clubId, setClubId] = useState(""); // "", "1", "2", ...

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cargar clubs para el select
  useEffect(() => {
    api.get("/api/clubs")
      .then(res => setClubs(res.data))
      .catch(() => setClubs([]));
  }, []);

  // Cargar pistas (sin filtros al entrar)
  useEffect(() => {
    cargarPistas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarPistas = async (opts = {}) => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (opts.tipo ?? tipo) params.tipo = (opts.tipo ?? tipo);
      if ((opts.clubId ?? clubId) !== "") params.clubId = Number(opts.clubId ?? clubId);
      const { data } = await api.get("/api/pistas", { params });
      setPistas(data);
    } catch (e) {
      setError("No se pudieron cargar las pistas.");
    } finally {
      setLoading(false);
    }
  };

  const onFiltrar = () => {
    cargarPistas({ tipo, clubId });
  };

  const onLimpiar = () => {
    setTipo("");
    setClubId("");
    cargarPistas({ tipo: "", clubId: "" });
  };

  const reservar = (pistaId) => {
    navigate(`/reservar/${pistaId}`);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span role="img" aria-label="raqueta">🎾</span> Reservar Pistas
      </h2>

      {/* Filtros */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 16,
          background: "#fafafa",
          border: "1px solid #eee",
          borderRadius: 8,
          padding: 12,
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#666" }}>
            Tipo
          </label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            style={{ padding: 6, minWidth: 180 }}
          >
            <option value="">Todos</option>
            <option value="Indoor">Indoor</option>
            <option value="Outdoor">Outdoor</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, color: "#666" }}>
            Club
          </label>
          <select
            value={clubId}
            onChange={(e) => setClubId(e.target.value)}
            style={{ padding: 6, minWidth: 220 }}
          >
            <option value="">Todos</option>
            {clubs.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button onClick={onFiltrar} style={{ padding: "6px 12px" }}>
            Filtrar
          </button>
          <button onClick={onLimpiar} style={{ padding: "6px 12px" }}>
            Limpiar
          </button>
        </div>
      </div>

      {/* Estado */}
      {loading && <p>Cargando pistas…</p>}
      {error && <p style={{ color: "#c00" }}>{error}</p>}

      {/* Lista Pistas */}
      <div style={{ display: "grid", gap: 14 }}>
        {pistas.map((p) => (
          <div
            key={p.id}
            style={{
              border: "1px solid #eee",
              borderRadius: 10,
              padding: 16,
              background: "#fff",
            }}
          >
            <div style={{ fontWeight: 600 }}>
              {p.nombre} — <span style={{ color: "#7a7a7a" }}>{p.tipo}</span>
            </div>
            <div style={{ marginTop: 4, color: "#444" }}>
              Precio: {Number(p.precioHora)} €/h
            </div>
            <div style={{ color: "#666" }}>Club: {p.clubNombre}</div>

            <div style={{ marginTop: 10 }}>
              <button
                onClick={() => reservar(p.id)}
                style={{
                  background: "rebeccapurple",
                  color: "#fff",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Reservar
              </button>
            </div>
          </div>
        ))}

        {!loading && pistas.length === 0 && (
          <div style={{ color: "#666" }}>No hay pistas para los filtros aplicados.</div>
        )}
      </div>
    </div>
  );
}