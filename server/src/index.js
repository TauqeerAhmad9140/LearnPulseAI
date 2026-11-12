import 'dotenv/config';
import mongoose from 'mongoose';
import { app } from './app.js';

if (!process.env.MONGODB_URI || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('Set MONGODB_URI and a JWT_SECRET of at least 32 characters in server/.env');
  process.exit(1);
}
try {
  await mongoose.connect(process.env.MONGODB_URI);
  const port = Number(process.env.PORT) || 8000;
  app.listen(port, () => console.log(`LearnPulse API listening on http://localhost:${port}`));
} catch (error) { console.error('MongoDB connection failed:', error.message); process.exit(1); }
