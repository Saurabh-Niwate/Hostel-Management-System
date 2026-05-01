import axios from "axios";
import { getStoredToken } from "./authStorage";


let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
if (!API_BASE_URL.endsWith('/')) {
  API_BASE_URL += '/';
}

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  // Axios overrides the baseURL path if the request URL starts with a slash.
  // We strip the leading slash here to ensure it appends to the /api path.
  if (config.url && config.url.startsWith('/')) {
    config.url = config.url.substring(1);
  }
  
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Bypass ngrok's free tier browser warning page which blocks API GET requests
  config.headers['ngrok-skip-browser-warning'] = '69420';

  return config;
});

