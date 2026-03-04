import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:4000';
export const API_AUTH_KEY = import.meta.env.VITE_CHAT_AUTH_KEY || '';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: API_AUTH_KEY ? { 'x-auth-key': API_AUTH_KEY } : undefined,
});
