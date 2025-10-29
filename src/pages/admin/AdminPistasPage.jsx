import { useEffect, useState } from "react";
import api from "../../api";
import NavBotonera from "../../components/NavBotonera";

export default function AdminPistasPage() {
  const [pistas, setPistas] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    id: null,
    nombre: "",
    tipo: "Indoor",
    precioHora: "",
    clubId: "",
  });

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
    if (!form.nombre.trim()) return alert("Nombre obligatorio");
    if (!form.tipo.trim()) return alert("Tipo obligatorio (Indoor/Outdoor)");
    if (!form.clubId) return alert("Selecciona un club");
    const precio = Number(form.precioHora);
    if (Number.isNaN(precio) || precio < 0) return alert("Precio inválido");

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
      } else {
        await api.post("/admin/pistas", payload);
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
    <div style={{ maxWidth: 1000, margin: "24px auto", paddingBottom: 80 }}>
      <h2 style={{ marginBottom: "16px" }}>Administración · Pistas</h2>

      <form
        onSubmit={onSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 140px 140px 1fr auto",
          gap: 8,
          margin: "16px 0",
        }}
      >
        <input
          placeholder="Nombre *"
          value={form.nombre}
          onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
        />
        <select
          value={form.tipo}
          onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
        >
          <option value="Indoor">Indoor</option>
          <option value="Outdoor">Outdoor</option>
        </select>
        <input
          type="number"
          step="0.01"
          placeholder="€/hora"
          value={form.precioHora}
          onChange={(e) => setForm((p) => ({ ...p, precioHora: e.target.value }))}
        />
        <select
          value={form.clubId}
          onChange={(e) => setForm((p) => ({ ...p, clubId: e.target.value }))}
        >
          <option value="">— Selecciona club —</option>
          {Array.isArray(clubs) &&
            clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
        </select>
        <div>
          <button type="submit" disabled={saving} style={{ marginRight: 8 }}>
            {form.id ? "Actualizar" : "Crear"}
          </button>
          {form.id && (
            <button type="button" onClick={resetForm} disabled={saving}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p>Cargando…</p>
      ) : Array.isArray(pistas) && pistas.length ? (
        <table
          width="100%"
          border="1"
          cellPadding="6"
          style={{ borderCollapse: "collapse" }}
        >
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
                  <button onClick={() => editar(p)} style={{ marginRight: 8 }}>
                    Editar
                  </button>
                  <button
                    onClick={() => eliminar(p.id)}
                    style={{ background: "#ffecec", color: "#b00020" }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No hay pistas.</p>
      )}

      <NavBotonera
        items={[
          { label: "Área Usuario", path: "/user" },
          { label: "Área Admin", path: "/admin" },
          { label: "Crear Club", path: "/admin/clubs" },
          { label: "Ver Pistas", path: "/reservar/7" },
        ]}
      />
    </div>
  );
}
