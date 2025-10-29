import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import UserPage from "./pages/UserPage";
import AdminPage from "./pages/AdminPage";            
import AdminClubsPage from "./pages/admin/AdminClubsPage";
import AdminPistasPage from "./pages/admin/AdminPistasPage";
import PistasPage from "./pages/PistasPage";
import ReservaPage from "./pages/ReservaPage";
import MisReservaPage from "./pages/MisReservaPage";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Raíz -> login por defecto */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />

        {/* Área usuario */}
        <Route
          path="/user"
          element={
            <PrivateRoute roles={["USER", "ADMIN"]}>
              <UserPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/pistas"
          element={
            <PrivateRoute roles={["USER", "ADMIN"]}>
              <PistasPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/reservar/:id"
          element={
            <PrivateRoute roles={["USER", "ADMIN"]}>
              <ReservaPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/mis-reservas"
          element={
            <PrivateRoute roles={["USER", "ADMIN"]}>
              <MisReservaPage />
            </PrivateRoute>
          }
        />

        {/* Área admin */}
        <Route
          path="/admin"
          element={
            <PrivateRoute roles={["ADMIN"]}>
              <AdminPage /> {/* Dashboard o portada admin */}
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/clubs"
          element={
            <PrivateRoute roles={["ADMIN"]}>
              <AdminClubsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/pistas"
          element={
            <PrivateRoute roles={["ADMIN"]}>
              <AdminPistasPage />
            </PrivateRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<div style={{ padding: 24 }}>404 — Página no encontrada</div>} />
      </Routes>
    </Router>
  );
}

export default App;
