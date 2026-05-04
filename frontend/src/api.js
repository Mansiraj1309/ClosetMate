// Central API base URL — set VITE_API_URL in your .env file
// Local:       VITE_API_URL=http://localhost:5001
// Production:  VITE_API_URL=https://your-backend.onrender.com
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default API_BASE;
