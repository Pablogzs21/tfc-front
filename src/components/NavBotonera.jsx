import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function NavBotonera({ items }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const botones =
    items ||
    [
      { label: "Área Usuario", path: "/user" },
      { label: "Área Admin", path: "/admin" },
      { label: "Crear Club", path: "/admin/clubs" },
      { label: "Ver Pistas", path: "/admin/pistas" },
    ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 12,
        background: "#fafafa",
        borderTop: "1px solid #ddd",
        padding: "10px 0",
        position: "sticky",
        bottom: 0,
        zIndex: 100,
      }}
    >
      {botones
        .filter((b) => b.path !== pathname)
        .map((b) => (
          <button
            key={b.path}
            onClick={() => navigate(b.path)}
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: "6px 12px",
              cursor: "pointer",
              background: pathname.startsWith(b.path)
                ? "#4b2885"
                : "#6433a8",
              color: "white",
              fontWeight: 500,
              transition: "0.2s",
            }}
          >
            {b.label}
          </button>
        ))}

      <button
        onClick={handleLogout}
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: "6px 12px",
          cursor: "pointer",
          background: "#b00020",
          color: "white",
          fontWeight: 500,
          transition: "0.2s",
        }}
      >
        Logout
      </button>
    </div>
  );
}
