import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import "../../responsive.css"; 

export default function AdminPistasPage() {
  const [pistas, setPistas] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    id: null,
    nombre: "",
    tipo: "Indoor",
    precioHora: "",
    clubId: "",
  });

  // Logout: limpia token y navega al login
  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      navigate("/login");
    } catch (e) {
      console.error(e);
      navigate("/login");
    }
  };

  const cargar = async () => {
    setLoading(true);
    try {
      const [rP, rC] = await Promise.all([
        api.get("/admin/pistas"),
        api.get("/admin/clubs"),
      ]);

      setPistas(Array.isArray(rP.data) ? rP.data : []);
      setClubs(Array.isArray(rC.data) ? rC.data : []);
    } catch (e) {
      console.error(e);
      setPistas([]);
      setClubs([]);
      alert(e?.response?.data ?? "No se pudieron cargar pistas/clubs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const resetForm = () =>
    setForm({
      id: null,
      nombre: "",
      tipo: "Indoor",
      precioHora: "",
      clubId: "",
    });

  const onSubmit = async (e) => {
    e.preventDefault();

    // pequeñas validaciones con feedback
    if (!form.nombre.trim()) {
      alert("El nombre es obligatorio");
      return;
    }

    if (!form.tipo.trim()) {
      alert("El tipo es obligatorio");
      return;
    }

    if (!form.clubId) {
      alert("Debes elegir un club");
      return;
    }

    const precio = Number(form.precioHora);
    if (Number.isNaN(precio) || precio < 0) {
      alert("Precio inválido");
      return;
    }

    const payload = {
      nombre: form.nombre,
      tipo: form.tipo,
      precioHora: precio,
      club: { id: Number(form.clubId) },
    };

    setSaving(true);
    try {
      if (form.id) {
        await api.put(`/admin/pistas/${form.id}`, payload);
        alert("Pista actualizada correctamente ✅");
      } else {
        await api.post("/admin/pistas", payload);
        alert("Pista creada correctamente ✅");
      }

      resetForm();
      await cargar();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data ?? "No se pudo guardar la pista");
    } finally {
      setSaving(false);
    }
  };

  const editar = (p) => {
    setForm({
      id: p.id,
      nombre: p.nombre ?? "",
      tipo: p.tipo ?? "Indoor",
      precioHora: p.precioHora ?? "",
      clubId: p.clubId ?? "",
    });
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta pista?")) return;
    try {
      await api.delete(`/admin/pistas/${id}`);
      await cargar();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data ?? "No se pudo eliminar la pista");
    }
  };

  return (
    <div className="admin-wrapper">
      {/* Título arriba (sin logout aquí) */}
      <h2 style={{ margin: 0 }}>Administración · Pistas</h2>

      {/* FORMULARIO - version responsive con grid */}
      <form onSubmit={onSubmit} className="form-grid-pistas">
        {/* Nombre */}
        <input
          placeholder="Nombre *"
          value={form.nombre}
          onChange={(e) =>
            setForm((p) => ({ ...p, nombre: e.target.value }))
          }
        />

        {/* Tipo */}
        <select
          value={form.tipo}
          onChange={(e) =>
            setForm((p) => ({ ...p, tipo: e.target.value }))
          }
        >
          <option value="Indoor">Indoor</option>
          <option value="Outdoor">Outdoor</option>
        </select>

        {/* Precio */}
        <input
          type="number"
          step="0.01"
          placeholder="€/hora"
          value={form.precioHora}
          onChange={(e) =>
            setForm((p) => ({ ...p, precioHora: e.target.value }))
          }
        />

        {/* Club */}
        <select
          value={form.clubId}
          onChange={(e) =>
            setForm((p) => ({ ...p, clubId: e.target.value }))
          }
        >
          <option value="">— Selecciona club —</option>
          {Array.isArray(clubs) &&
            clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
        </select>

        {/* Botones Crear / Cancelar */}
        <div>
          <button type="submit" disabled={saving} style={{ marginRight: 8 }}>
            {form.id ? "Actualizar" : "Crear"}
          </button>

          {form.id && (
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              style={{ background: "#eee" }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* TABLA / LISTADO */}
      {loading ? (
        <p>Cargando…</p>
      ) : Array.isArray(pistas) && pistas.length ? (
        <div className="table-wrapper">
          <table border="1" cellPadding="6">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>€/hora</th>
                <th>Club</th>
                <th style={{ width: 210 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pistas.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.nombre}</td>
                  <td>{p.tipo}</td>
                  <td>{p.precioHora}</td>
                  <td>{p.clubNombre ?? p.clubId}</td>
                  <td>
                    <button
                      onClick={() => editar(p)}
                      style={{ marginRight: 8 }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminar(p.id)}
                      style={{
                        background: "#ffecec",
                        color: "#b00020",
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No hay pistas.</p>
      )}

      {/* BOTONERA INFERIOR (sticky abajo, responsive) */}
      <div className="nav-botonera-responsive">
        <button onClick={() => navigate("/user")}>Área Usuario</button>
        <button onClick={() => navigate("/admin")}>Área Admin</button>
        <button onClick={() => navigate("/admin/clubs")}>Crear Club</button>
        <button onClick={() => navigate("/reservar/7")}>Ver Pistas</button>

        <button
          onClick={handleLogout}
          style={{
            background: "#b00020",
            color: "white",
            border: 0,
            borderRadius: 8,
            padding: "6px 12px",
            fontWeight: 500,
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
