import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
});

// mete automáticamente el token en cada request
api.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export default api;
