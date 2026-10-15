import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, CalendarDays, Check, CheckCheck, Circle, ClipboardList, LayoutGrid, ListTodo, MoreHorizontal, Plus, Search, Sparkles, Trash2, X, Pencil, LoaderCircle } from 'lucide-react';
import './styles.css';

const API = `${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/api`;
const emptyForm = { title: '', description: '', priority: 'medium', dueDate: '' };
const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };
async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Unable to reach the server. Please try again.');
  }
  return response.status === 204 ? null : response.json();
}
function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(new Set());
  const [notice, setNotice] = useState('');
  const dialog = useRef(null);
  const addButton = useRef(null);
  async function load() {
    setLoading(true); setError('');
    try { setTasks(await request('/tasks')); } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 3500); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => {
    if (modal) dialog.current.showModal();
    else if (dialog.current.open) dialog.current.close();
  }, [modal]);
  const active = tasks.filter(t => !t.completed);
  const completed = tasks.length - active.length;
  const dueToday = active.filter(t => t.dueDate === today()).length;
  const filters = [
    { id: 'all', name: 'All tasks', icon: LayoutGrid, count: tasks.length },
    { id: 'active', name: 'In progress', icon: Circle, count: active.length },
    { id: 'completed', name: 'Completed', icon: CheckCheck, count: completed },
    { id: 'today', name: 'Due today', icon: CalendarDays, count: dueToday },
  ];
  const visible = tasks.filter(t => (filter === 'all' || (filter === 'active' && !t.completed) || (filter === 'completed' && t.completed) || (filter === 'today' && !t.completed && t.dueDate === today())) && `${t.title} ${t.description}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'priority' ? ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]) : sort === 'due' ? (a.dueDate || '9999').localeCompare(b.dueDate || '9999') : new Date(b.createdAt) - new Date(a.createdAt));
  function openForm(task = null) {
    setError('');
    setForm(task ? { title: task.title, description: task.description, priority: task.priority, dueDate: task.dueDate } : emptyForm);
    setModal({ kind: 'form', task });
  }
  function closeModal() { if (!saving) { setModal(null); setError(''); } }
  async function save(event) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const edited = modal.task;
      const result = await request(edited ? `/tasks/${edited._id}` : '/tasks', { method: edited ? 'PATCH' : 'POST', body: JSON.stringify(form) });
      setTasks(previous => edited ? previous.map(t => t._id === result._id ? result : t) : [result, ...previous]);
      setModal(null); setNotice(edited ? 'Task updated' : 'Task added. You’ve got this!');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  async function toggle(task) {
    setBusy(previous => new Set(previous).add(task._id)); setError('');
    try {
      const result = await request(`/tasks/${task._id}`, { method: 'PATCH', body: JSON.stringify({ completed: !task.completed }) });
      setTasks(previous => previous.map(t => t._id === result._id ? result : t));
      setNotice(result.completed ? 'One less thing on your list. Nice work!' : 'Task marked in progress');
    } catch (err) { setError(err.message); }
    finally { setBusy(previous => { const next = new Set(previous); next.delete(task._id); return next; }); }
  }
  async function remove() {
    setSaving(true); setError('');
    try {
      await request(`/tasks/${modal.task._id}`, { method: 'DELETE' });
      setTasks(previous => previous.filter(t => t._id !== modal.task._id));
      setModal(null); setNotice('Task deleted');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#" onClick={e => { e.preventDefault(); setFilter('all'); }}><span className="brand-mark"><Check size={23}/></span>taskly<span className="brand-dot">.</span></a>
      <div className="workspace"><span className="workspace-icon">P</span><div>Personal workspace<small>Your space to get things done</small></div></div>
      <p className="nav-label">WORKSPACE</p>
      <nav aria-label="Task views">{filters.map(({ id, name, icon: Icon, count }) => <button key={id} className={`nav-item ${filter === id ? 'selected' : ''}`} onClick={() => setFilter(id)}><Icon size={18}/><span>{name}</span><span className="nav-count">{count}</span></button>)}</nav>
      <div className="sidebar-note"><Sparkles size={20}/><h3>A little progress,<br/>every day.</h3><p>Big things start with a small task. Make today count.</p><div className="note-decoration">↗</div></div>
      <div className="profile"><span className="avatar">Y</span><div>Your workspace<small>Personal account</small></div><MoreHorizontal size={19} aria-hidden="true"/></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><span>Workspace <span className="breadcrumb-slash">/</span> <strong>My tasks</strong></span><span className="topbar-date"><CalendarDays size={15}/>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></header>
      <main>
        <div className="page-heading"><div><div className="eyebrow">A LITTLE FOCUS GOES A LONG WAY</div><h1>Make room for what matters<span>.</span></h1><p>Clear your mind. Organize your day. One task at a time.</p></div><button ref={addButton} className="primary" onClick={() => openForm()}><Plus size={18}/> New task</button></div>
        <section className="stats" aria-label="Task summary">
          <div className="stat-card"><div className="stat-top"><span>Total tasks</span><span className="stat-icon purple"><ClipboardList size={18}/></span></div><div className="stat-number">{tasks.length}<span>in your workspace</span></div></div>
          <div className="stat-card"><div className="stat-top"><span>In progress</span><span className="stat-icon orange"><Circle size={18}/></span></div><div className="stat-number">{active.length}<span>ready for your attention</span></div></div>
          <div className="stat-card"><div className="stat-top"><span>Completed</span><span className="stat-icon green"><CheckCheck size={18}/></span></div><div className="stat-number">{completed}<span>a step in the right direction</span></div></div>
        </section>
        <section className="task-section">
          <div className="section-heading"><div><h2>Your tasks <span>{visible.length}</span></h2><p>A clear plan for the things you want to do.</p></div><label className="search"><Search size={17}/><input aria-label="Search tasks" placeholder="Search tasks…" value={query} onChange={e => setQuery(e.target.value)}/>{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={14}/></button>}</label></div>
          <div className="toolbar"><div className="tabs">{filters.slice(0, 3).map(f => <button key={f.id} className={filter === f.id ? 'active-tab' : ''} onClick={() => setFilter(f.id)}>{f.id === 'all' ? 'All tasks' : f.name}<span>{f.count}</span></button>)}</div><label className="sort">Sort by <select aria-label="Sort tasks" value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest first</option><option value="due">Due date</option><option value="priority">Priority</option></select></label></div>
          {error && <div role="alert" className="error">{error}{!modal && <button onClick={load}>Retry</button>}</div>}
          <div className="task-list" aria-busy={loading}>
            {loading ? <div className="empty"><LoaderCircle className="spin" size={28}/><h3>Loading your tasks…</h3></div> : visible.length ? visible.map(task => <article key={task._id} className={`task-row ${task.completed ? 'is-completed' : ''}`}>
              <button className="check-task" aria-label={`${task.completed ? 'Reopen' : 'Complete'} ${task.title}`} aria-pressed={task.completed} disabled={busy.has(task._id)} onClick={() => toggle(task)}>{busy.has(task._id) ? <LoaderCircle size={14} className="spin"/> : task.completed && <Check size={14}/>}</button>
              <div className="task-content"><h3>{task.title}</h3>{task.description && <p>{task.description}</p>}<div className="task-meta"><span className={`priority ${task.priority}`}><i/>{task.priority} priority</span>{task.dueDate && <span className={`due ${!task.completed && task.dueDate < today() ? 'overdue' : ''}`}><CalendarDays size={13}/>{task.dueDate === today() ? 'Today' : new Date(`${task.dueDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}{!task.completed && task.dueDate < today() ? ' · Overdue' : ''}</span>}</div></div>
              <div className="task-actions"><button aria-label={`Edit ${task.title}`} title="Edit task" disabled={busy.has(task._id)} onClick={() => openForm(task)}><Pencil size={16}/></button><button aria-label={`Delete ${task.title}`} title="Delete task" disabled={busy.has(task._id)} onClick={() => { setError(''); setModal({ kind: 'delete', task }); }}><Trash2 size={16}/></button></div>
            </article>) : <div className="empty"><div className="empty-icon"><ListTodo size={28}/></div><h3>{query ? 'No matching tasks' : filter === 'completed' ? 'Your wins will show up here' : filter === 'today' ? 'A little breathing room' : filter === 'active' && tasks.length ? 'You’re all caught up!' : 'A fresh start, a clear mind'}</h3><p>{query ? 'Try a different search to find what you need.' : filter === 'today' ? 'You have no tasks due today.' : filter === 'completed' ? 'Complete a task to celebrate your progress.' : 'Add a task and take the first step toward your next goal.'}</p>{!query && filter !== 'completed' && <button className="primary" onClick={() => openForm()}><Plus size={17}/> Add your first task</button>}</div>}
          </div>
          <div className="list-footer"><span>{active.length} task{active.length !== 1 ? 's' : ''} left to do</span><span>Small steps. Real progress. <Sparkles size={13}/></span></div>
        </section>
        <section className="progress-banner"><span className="progress-symbol"><ArrowUpRight size={24}/></span><div><h3>Your progress, at a glance</h3><p>{tasks.length ? `${completed} of ${tasks.length} tasks completed. Keep the momentum going.` : 'Your next accomplishment starts with your first task.'}</p></div><div className="progress-detail"><span>{progress}% complete</span><div className="progress-track" role="progressbar" aria-label="Tasks completed" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${progress}%` }}/></div></div></section>
        <footer>Made for a more intentional day.</footer>
      </main>
    </div>
    <dialog ref={dialog} onCancel={e => { e.preventDefault(); closeModal(); }} onClick={e => { if (e.target === dialog.current) closeModal(); }} onClose={() => addButton.current?.focus()} aria-labelledby="dialog-title">
      {modal && <div className="modal-body"><div className="modal-heading"><h2 id="dialog-title">{modal.kind === 'delete' ? 'Delete task?' : modal.task ? 'Edit task' : 'A new little step'}</h2><button disabled={saving} aria-label="Close dialog" onClick={closeModal}><X size={20}/></button></div>
        {modal.kind === 'delete' ? <><p className="delete-copy">“{modal.task.title}” will be permanently deleted.</p>{error && <p role="alert" className="error">{error}</p>}<div className="modal-buttons"><button disabled={saving} className="secondary" onClick={closeModal}>Cancel</button><button className="danger" disabled={saving} onClick={remove}>{saving ? 'Deleting…' : 'Delete task'}</button></div></> : <form onSubmit={save}><p className="modal-subtitle">Give your next goal a place to start.</p><label>Task name<input autoFocus required maxLength={200} placeholder="What would you like to get done?" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></label><label>Description <span>(optional)</span><textarea rows={3} maxLength={2000} placeholder="Add a few details…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/></label><div className="form-grid"><label>Priority<select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option value="low">Low priority</option><option value="medium">Medium priority</option><option value="high">High priority</option></select></label><label>Due date <span>(optional)</span><input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}/></label></div>{error && <p role="alert" className="error">{error}</p>}<div className="modal-buttons"><button type="button" className="secondary" disabled={saving} onClick={closeModal}>Cancel</button><button className="primary" disabled={saving || !form.title.trim()}>{saving ? 'Saving…' : modal.task ? 'Save changes' : 'Create task'}{!saving && <Plus size={16}/>}</button></div></form>}
      </div>}
    </dialog>
    {notice && <div className="toast" role="status"><CheckCheck size={18}/>{notice}</div>}
  </div>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
