import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8080" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const isAuth = config.url?.startsWith("/api/auth/");
  if (token && !isAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;