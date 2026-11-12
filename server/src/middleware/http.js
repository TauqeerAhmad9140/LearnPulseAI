import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export function requireFields(body, keys) {
  for (const key of keys) if (typeof body[key] !== 'string' || !body[key].trim()) throw new HttpError(400, `${key} is required`);
}
export async function authenticate(req, _res, next) {
  try {
    const token = req.cookies.lp_session;
    if (!token) throw new HttpError(401, 'Please log in to continue');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) throw new HttpError(401, 'Session expired');
    req.user = user;
    next();
  } catch (error) { next(error instanceof HttpError ? error : new HttpError(401, 'Session expired')); }
}
export const adminOnly = (req, _res, next) => req.user?.role === 'admin' ? next() : next(new HttpError(403, 'Admin access required'));
export const studentOnly = (req, _res, next) => req.user?.role === 'student' ? next() : next(new HttpError(403, 'Student access required'));
export function parseId(id) { if (!/^[0-9a-fA-F]{24}$/.test(id || '')) throw new HttpError(400, 'Invalid ID'); return id; }
export function errorHandler(error, _req, res, _next) {
  if (error.code === 11000) return res.status(409).json({ message: 'This record already exists' });
  if (error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ message: error.message });
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ message: status >= 500 ? 'Something went wrong. Please try again.' : error.message });
}
