import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';

try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskly', { serverSelectionTimeoutMS: 5000 });
  const server = createApp().listen(process.env.PORT || 5000, () => console.log(`Task API listening on port ${process.env.PORT || 5000}`));
  const shutdown = () => server.close(async () => { await mongoose.disconnect(); process.exit(0); });
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (error) {
  console.error(`Cannot connect to MongoDB: ${error.message}\nSet MONGODB_URI in backend/.env and make sure MongoDB is running.`);
  process.exit(1);
}
