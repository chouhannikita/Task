import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

function fixture() {
  const records = new Map();
  const id = '507f1f77bcf86cd799439011';
  const model = {
    find: () => ({ sort: async () => [...records.values()] }),
    create: async data => { const task = { _id: id, description: '', priority: 'medium', completed: false, dueDate: '', ...data }; records.set(id, task); return task; },
    findByIdAndUpdate: async (key, data) => { if (!records.has(key)) return null; const task = { ...records.get(key), ...data }; records.set(key, task); return task; },
    findByIdAndDelete: async key => { const task = records.get(key); records.delete(key); return task; },
  };
  return request(createApp(model));
}

test('create, list, edit, complete, and delete a task', async () => {
  const api = fixture();
  const created = await api.post('/api/tasks').send({ title: '  Plan the week  ', priority: 'high', dueDate: '2026-10-15' }).expect(201);
  assert.equal(created.body.title, 'Plan the week');
  const id = created.body._id;
  const list = await api.get('/api/tasks').expect(200);
  assert.equal(list.body.length, 1);
  const edited = await api.patch(`/api/tasks/${id}`).send({ title: 'Plan tomorrow', completed: true }).expect(200);
  assert.equal(edited.body.completed, true);
  assert.equal(edited.body.title, 'Plan tomorrow');
  await api.delete(`/api/tasks/${id}`).expect(204);
  assert.deepEqual((await api.get('/api/tasks')).body, []);
  await api.patch(`/api/tasks/${id}`).send({ completed: false }).expect(404);
  await api.delete(`/api/tasks/${id}`).expect(404);
});

test('reject invalid fields and malformed IDs', async () => {
  const api = fixture();
  for (const body of [{}, { title: ' ' }, { title: 'x', priority: 'urgent' }, { title: 'x', completed: 'yes' }, { title: 'x', dueDate: '2026-02-30' }, { title: 'x', description: 12 }]) {
    await api.post('/api/tasks').send(body).expect(400);
  }
  await api.patch('/api/tasks/not-an-id').send({ completed: true }).expect(400);
  await api.patch('/api/tasks/507f1f77bcf86cd799439011').send({}).expect(400);
  await api.post('/api/tasks').set('Content-Type', 'application/json').send('{broken').expect(400);
});

test('database errors return a safe response', async () => {
  const api = request(createApp({ find: () => ({ sort: async () => { throw new Error('Database unavailable'); } }) }));
  const response = await api.get('/api/tasks').expect(500);
  assert.equal(response.body.message, 'Unable to complete the request. Please try again.');
});
