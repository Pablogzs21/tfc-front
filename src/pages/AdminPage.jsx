import { useEffect, useState } from "react";
import axios from "axios";
import NavBotonera from "../components/NavBotonera"; 

export default function AdminPage() {
  const [data, setData] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/users/me", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      })
      .then((res) => setData(res.data))
      .catch(() => setData("Error: no autorizado"));
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h2>Área de Administrador</h2>
      <p>👑 Solo ADMIN</p>

      {typeof data === "string" ? (
        <p>{data}</p>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <p>👤 {data.nombre} {data.apellidos}</p>
          <p>👥 Rol: {data.role}</p>
          <p>👤 Username: {data.username}</p>
        </div>
      )}



      {}
      <NavBotonera
        items={[
          { label: "Área de Admin", path: "/admin" },
          { label: "Área Usuario",  path: "/user" },
          { label: "Crear Club",    path: "/admin/clubs" },  
          { label: "Crear Pista",   path: "/admin/pistas" },  
        ]}
      />
    </div>
  );
}
