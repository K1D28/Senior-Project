// Backend URL - configure via environment variables
// For local development: VITE_BACKEND_URL=http://localhost:5001
// For production: VITE_BACKEND_URL=https://your-backend.onrender.com

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

export default BACKEND_URL;
