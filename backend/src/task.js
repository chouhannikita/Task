import mongoose from 'mongoose';
export const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: '', maxlength: 2000 },
  completed: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  dueDate: { type: String, default: '' },
}, { timestamps: true });
export default mongoose.model('Task', taskSchema);

export function validateTask(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Provide a task object.');
  const result = {};
  if (!partial || 'title' in body) {
    if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 200) throw new Error('Title must contain 1–200 characters.');
    result.title = body.title.trim();
  }
  if ('description' in body) {
    if (typeof body.description !== 'string' || body.description.length > 2000) throw new Error('Description must contain at most 2,000 characters.');
    result.description = body.description.trim();
  }
  if ('completed' in body) {
    if (typeof body.completed !== 'boolean') throw new Error('Completed must be a boolean.');
    result.completed = body.completed;
  }
  if ('priority' in body) {
    if (!['low', 'medium', 'high'].includes(body.priority)) throw new Error('Choose a valid priority.');
    result.priority = body.priority;
  }
  if ('dueDate' in body) {
    if (typeof body.dueDate !== 'string' || (body.dueDate !== '' && (!/^\d{4}-\d{2}-\d{2}$/.test(body.dueDate) || !Number.isFinite(Date.parse(body.dueDate)) || new Date(body.dueDate).toISOString().slice(0, 10) !== body.dueDate))) throw new Error('Choose a valid due date.');
    result.dueDate = body.dueDate;
  }
  if (partial && !Object.keys(result).length) throw new Error('Provide at least one task field to update.');
  return result;
}
