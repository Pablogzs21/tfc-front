import { Link, useNavigate } from "react-router-dom";

function NavBar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <footer
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        backgroundColor: "#f0f0f0",
        padding: "10px",
        textAlign: "center",
        borderTop: "1px solid #ccc",
      }}
    >
      <Link to="/user" style={{ margin: "0 10px", textDecoration: "none", color: "purple" }}>
        Área de Usuario
      </Link>
      <Link to="/admin" style={{ margin: "0 10px", textDecoration: "none", color: "purple" }}>
        Área de Admin
      </Link>
      {/* NUEVO */}
      <Link to="/reservar/7" style={{ margin: "0 10px", textDecoration: "none", color: "purple" }}>
        Pistas
      </Link>
      <Link to="/mis-reservas" style={{ margin: "0 10px", textDecoration: "none", color: "purple" }}>
        Mis reservas
      </Link>

      <button onClick={handleLogout} style={{ marginLeft: "10px", padding: "5px 10px" }}>
        Logout
      </button>
    </footer>
  );
}

export default NavBar;