import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import Task, { validateTask } from './task.js';

export function createApp(model = Task) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/api/tasks', async (_req, res) => res.json(await model.find().sort({ createdAt: -1 })));
  app.post('/api/tasks', async (req, res) => {
    let data;
    try { data = validateTask(req.body); } catch (error) { return res.status(400).json({ message: error.message }); }
    res.status(201).json(await model.create(data));
  });
  app.param('id', (_req, res, next, id) => {
    if (!mongoose.isObjectIdOrHexString(id)) return res.status(400).json({ message: 'Invalid task ID.' });
    next();
  });
  app.patch('/api/tasks/:id', async (req, res) => {
    let data;
    try { data = validateTask(req.body, true); } catch (error) { return res.status(400).json({ message: error.message }); }
    const task = await model.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json(task);
  });
  app.delete('/api/tasks/:id', async (req, res) => {
    const task = await model.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.status(204).end();
  });
  app.use((_req, res) => res.status(404).json({ message: 'Route not found.' }));
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ message: 'Request body is too large.' });
    console.error(error.message);
    res.status(500).json({ message: 'Unable to complete the request. Please try again.' });
  });
  return app;
}
