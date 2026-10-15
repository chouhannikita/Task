import 'dotenv/config';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import Task from '../src/task.js';
import { createApp } from '../src/app.js';

let taskId;
try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27028/taskly_verification', { serverSelectionTimeoutMS: 5000 });
  const api = request(createApp());
  const created = await api.post('/api/tasks').send({ title: 'Persistence smoke test', priority: 'high', dueDate: '2026-10-15' }).expect(201);
  taskId = created.body._id;
  assert.equal((await Task.findById(taskId)).title, 'Persistence smoke test');
  await api.patch(`/api/tasks/${taskId}`).send({ completed: true, title: 'Updated smoke test' }).expect(200);
  assert.equal((await Task.findById(taskId)).completed, true);
  const list = await api.get('/api/tasks').expect(200);
  assert.ok(list.body.some(task => task._id === taskId && task.title === 'Updated smoke test'));
  await api.delete(`/api/tasks/${taskId}`).expect(204);
  assert.equal(await Task.findById(taskId), null);
  console.log('MongoDB persistence smoke test passed.');
} finally {
  if (taskId) await Task.findByIdAndDelete(taskId);
  await mongoose.disconnect();
}
