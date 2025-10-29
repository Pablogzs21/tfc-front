import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    axios
      .post("http://localhost:8080/api/auth/login", { username, password })
      .then((res) => {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);

        if (res.data.role === "ADMIN") {
          navigate("/admin");
        } else {
          navigate("/user");
        }
      })
      .catch(() => {
        alert("Credenciales incorrectas");
      });
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>🔐 Iniciar sesión</h2>

        <input
          type="text"
          placeholder="👤 Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="🔑 Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button type="submit" style={styles.button}>
          Iniciar sesión
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #cbb4d4, #f5f7fa)",
  },
  form: {
    backgroundColor: "#fff",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
    display: "flex",
    flexDirection: "column",
    width: "320px",
    animation: "fadeIn 0.8s ease",
  },
  title: {
    textAlign: "center",
    marginBottom: "25px",
    color: "#333",
    fontWeight: "bold",
    fontSize: "24px",
  },
  input: {
    padding: "14px",
    marginBottom: "18px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontSize: "16px",
    outline: "none",
    transition: "border-color 0.3s",
  },
  button: {
    padding: "14px",
    backgroundColor: "#6a0dad",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background-color 0.3s, transform 0.2s",
  },
};


export default LoginPage;



