import React from "react";
import { Link } from "react-router-dom";
import NavBotonera from "../../components/NavBotonera";

export default function AdminHomePage() {
  return (
    <div className="container" style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ margin: "32px 0" }}>Panel de Administración 🧠</h1>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          alignItems: "center",
        }}
      >
        <Link to="/admin/clubs" style={{ textDecoration: "none" }}>
          <button style={{ padding: "12px 24px" }}>⚙️ Gestionar Clubs</button>
        </Link>
        <Link to="/admin/pistas" style={{ textDecoration: "none" }}>
          <button style={{ padding: "12px 24px" }}>🎾 Gestionar Pistas</button>
        </Link>
      </div>

      {}
      <NavBotonera
        items={[
          { label: "Área de Admin", path: "/admin" },
          { label: "Crear Club",    path: "/admin/clubs" },  
          { label: "Crear Pista",   path: "/admin/pistas" },  
        ]}
      />
    </div>
  );
}
