// Centralized API & WebSocket Configuration for Local and Subdomain Production
const envUrl = import.meta.env.VITE_API_URL;

export const API_BASE_URL =
  envUrl !== undefined && envUrl !== ''
    ? envUrl
    : import.meta.env.PROD
    ? '' // In production with reverse proxy / same domain, use relative URLs
    : 'http://localhost:5000'; // In dev mode, default to backend port 5000

export const getApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

export const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (API_BASE_URL) {
    return API_BASE_URL;
  }
  return undefined; // Defaults to current origin in socket.io-client
};
