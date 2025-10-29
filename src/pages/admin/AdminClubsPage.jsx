import { useEffect, useState } from "react";
import api from "../../api";
import NavBotonera from "../../components/NavBotonera";

export default function AdminClubsPage() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    id: null,
    nombre: "",
    direccion: "",
    telefono: "",
    lat: "",
    lng: "",
  });
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/clubs");
      setClubs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setClubs([]);
      alert(e?.response?.data ?? "No se pudieron cargar los clubs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const resetForm = () =>
    setForm({ id: null, nombre: "", direccion: "", telefono: "", lat: "", lng: "" });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      alert("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre,
        direccion: form.direccion,
        telefono: form.telefono || null,
        lat: form.lat === "" ? null : parseFloat(form.lat),
        lng: form.lng === "" ? null : parseFloat(form.lng),
      };

      if (form.id) {
        await api.put(`/admin/clubs/${form.id}`, payload);
      } else {
        await api.post("/admin/clubs", payload);
      }

      resetForm();
      await cargar();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data ?? "No se pudo guardar el club");
    } finally {
      setSaving(false);
    }
  };

  const editar = (c) => {
    setForm({
      id: c.id,
      nombre: c.nombre ?? "",
      direccion: c.direccion ?? "",
      telefono: c.telefono ?? "",
      lat: c.lat ?? "",
      lng: c.lng ?? "",
    });
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar este club?")) return;
    try {
      await api.delete(`/admin/clubs/${id}`);
      await cargar();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data ?? "No se pudo eliminar el club");
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", paddingBottom: 80 }}>
      <h2>Administración · Clubs</h2>

      <form
        onSubmit={onSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr auto",
          gap: 8,
          margin: "16px 0",
        }}
      >
        <input
          placeholder="Nombre *"
          value={form.nombre}
          onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
        />
        <input
          placeholder="Dirección"
          value={form.direccion}
          onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))}
        />
        <input
          placeholder="Teléfono"
          value={form.telefono}
          onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
        />
        <input
          type="number"
          step="any"
          placeholder="Latitud"
          value={form.lat}
          onChange={(e) => setForm((p) => ({ ...p, lat: e.target.value }))}
        />
        <input
          type="number"
          step="any"
          placeholder="Longitud"
          value={form.lng}
          onChange={(e) => setForm((p) => ({ ...p, lng: e.target.value }))}
        />

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
      ) : Array.isArray(clubs) && clubs.length ? (
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
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Lat</th>
              <th>Lng</th>
              <th style={{ width: 210 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clubs.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.nombre}</td>
                <td>{c.direccion ?? "-"}</td>
                <td>{c.telefono ?? "-"}</td>
                <td>{c.lat ?? "-"}</td>
                <td>{c.lng ?? "-"}</td>
                <td>
                  <button onClick={() => editar(c)} style={{ marginRight: 8 }}>
                    Editar
                  </button>
                  <button
                    onClick={() => eliminar(c.id)}
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
        <p>No hay clubs.</p>
      )}

      {}
      <NavBotonera
        items={[
          { label: "Área Usuario", path: "/user" },
          { label: "Área Admin",   path: "/admin" },
          { label: "Crear Pista",  path: "/admin/pistas" },
        ]}
      />
    </div>
  );
}
