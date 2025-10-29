import axios from "axios";

const API_URL = "http://localhost:8080/api/auth";

export const login = async (username, password) => {
  const { data } = await axios.post(`${API_URL}/login`, { username, password }, {
    headers: { "Content-Type": "application/json" },
  });

  const token = data.token || data.jwt || data.accessToken;
  if (!token) throw new Error("El backend no devolvió token");

  localStorage.setItem("token", token);
  if (data.role) localStorage.setItem("role", data.role);
  return data;
};