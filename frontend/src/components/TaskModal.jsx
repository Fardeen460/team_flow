import { useState, useEffect } from 'react'
import { tasksAPI, projectsAPI } from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function TaskModal({ task, projectId, defaultStatus, members, onClose, onSaved, editOnly }) {
  const editing = !!task
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || defaultStatus || 'todo',
    priority: task?.priority || 'medium',
    due_date: task?.due_date ? format(new Date(task.due_date), "yyyy-MM-dd'T'HH:mm") : '',
    assignee_id: task?.assignee_id || '',
  })
  const [loading, setLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState(projectId || task?.project_id || '')

  useEffect(() => {
    if (editOnly) {
      projectsAPI.list().then(r => setProjects(r.data))
    }
  }, [editOnly])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const payload = {
      ...form,
      assignee_id: form.assignee_id ? parseInt(form.assignee_id) : null,
      due_date: form.due_date || null,
    }
    try {
      if (editing) {
        await tasksAPI.update(task.id, payload)
        toast.success('Task updated')
      } else {
        await tasksAPI.create(selectedProject || projectId, payload)
        toast.success('Task created')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save task')
    } finally {
      setLoading(false)
    }
  }

  const memberList = members?.length > 0 ? members : []

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-lg text-white">
            {editing ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="btn-ghost text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input
              type="text"
              className="input"
              placeholder="Task title"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Add more details…"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Due Date</label>
            <input
              type="datetime-local"
              className="input"
              value={form.due_date}
              onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
            />
          </div>

          {memberList.length > 0 && (
            <div>
              <label className="label">Assignee</label>
              <select className="input" value={form.assignee_id} onChange={e => setForm(p => ({ ...p, assignee_id: e.target.value }))}>
                <option value="">Unassigned</option>
                {memberList.map(m => (
                  <option key={m.id} value={m.id}>{m.avatar} {m.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {editing ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
