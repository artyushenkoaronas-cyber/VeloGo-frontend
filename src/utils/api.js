import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://velogo.onrender.com'
    : 'http://localhost:5000');

const api = axios.create({ baseURL: BASE });

export default api;
