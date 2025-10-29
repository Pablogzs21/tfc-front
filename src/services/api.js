import axios from "axios";

const baseURL = process.env.REACT_APP_API_BASE || "http://localhost:8080";

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const isAuth = config.url?.startsWith("/api/auth/");
  if (token && !isAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;