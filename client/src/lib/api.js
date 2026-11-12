import axios from 'axios';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', withCredentials: true, timeout: 35000 });
export function messageOf(error) { return error.response?.data?.message || (error.code === 'ECONNABORTED' ? 'The request timed out. Please retry.' : 'Could not connect. Please try again.'); }
export function videoUrl(id) { return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`; }
