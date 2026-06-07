// Dynamic API base URL — fallback to production if not specified in .env
const API_BASE = import.meta.env.VITE_API_URL || 'https://closetmate-n5l2.onrender.com';

export default API_BASE;
