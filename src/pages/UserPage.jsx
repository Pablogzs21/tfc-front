import { useEffect, useState } from "react";
import axios from "axios";
import NavBar from "../components/NavBar";

function UserPage() {
  const [data, setData] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/users/me", {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      })
      .then((res) => setData(res.data))
      .catch((err) => setData("Error: no autorizado"));
  }, []);

  return (
    <div style={{ paddingBottom: "60px", textAlign: "center", marginTop: "50px" }}>
      <h2>Área de Usuario</h2>
      <p>📦 Datos visibles para usuarios autenticados (USER o ADMIN)</p>
      {typeof data === "string" ? (
        <p>{data}</p>
      ) : (
        <div style={{ textAlign: "left", display: "inline-block", marginTop: "20px" }}>
          <p>👤 Nombre: {data.nombre} {data.apellidos}</p>
          <p>📅 Fecha de nacimiento: {data.fechaNacimiento}</p>
          <p>👥 Rol: {data.role}</p>
          <p>👤 Username: {data.username}</p>
        </div>
      )}

      <NavBar />
    </div>
  );
}

export default UserPage;



