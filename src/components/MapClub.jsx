// src/components/MapClub.jsx
import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Corrige el icono por defecto de Leaflet en bundlers
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

// Convierte lat/lng a número de forma robusta (strings, coma decimal, etc.)
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

export default function MapClub({ lat, lng, nombre = "Club", direccion = "", height = 300 }) {
  const latNum = toNum(lat);
  const lngNum = toNum(lng);
  const hasCoords = Number.isFinite(latNum) && Number.isFinite(lngNum);

  if (!hasCoords) {
    const hasDireccion = direccion && direccion.trim().length > 0;
    const query = hasDireccion ? direccion : (nombre || "club pádel");
    return (
      <div style={{ padding: 12, background: "#f5f5f7", borderRadius: 8, border: "1px solid #eee" }}>
        <p style={{ margin: 0, fontWeight: 600 }}>Ubicación no disponible.</p>
        {hasDireccion ? (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#6b21a8" }}
          >
            Abrir en Google Maps
          </a>
        ) : (
          <p style={{ margin: "6px 0 0", color: "#666" }}>No hay dirección registrada.</p>
        )}
      </div>
    );
  }

  const center = [latNum, lngNum];

  return (
    <div style={{ height, borderRadius: 12, overflow: "hidden", border: "1px solid #eee" }}>
      <MapContainer center={center} zoom={16} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <Marker position={center}>
          <Popup>
            <strong>{nombre}</strong>
            <br />
            {direccion || "Sin dirección"}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
