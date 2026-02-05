import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:4000';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});
