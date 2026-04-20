import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

// Automatically attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const signup = (data: any) => API.post('/api/auth/signup', data);
export const login = (data: any) => API.post('/api/auth/login', data);

// Research
export const runQuery = (query: string, tags: string) =>
  API.post('/api/research/query', { query, tags });
export const getReports = () => API.get('/api/research/reports');
export const getReport = (id: number) => API.get(`/api/research/reports/${id}`);
export const deleteReport = (id: number) => API.delete(`/api/research/reports/${id}`);
export const getStockChart = (ticker: string, period: string = '1mo') =>
  API.get('/api/research/stock-chart', {
    params: { ticker, period },
  });

// Watchlist
export const getWatchlist = () => API.get('/api/watchlist/');
export const addToWatchlist = (symbol: string, company_name: string) =>
  API.post('/api/watchlist/', { symbol, company_name });
export const removeFromWatchlist = (id: number) => API.delete(`/api/watchlist/${id}`);