import { useState, useEffect } from 'react'
import { tasksAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { format, isPast, isToday } from 'date-fns'
import toast from 'react-hot-toast'
import TaskModal from '../components/TaskModal'

const STATUS_OPTS = ['all', 'todo', 'in_progress', 'in_review', 'done']
const PRIORITY_OPTS = ['all', 'urgent', 'high', 'medium', 'low']

function statusLabel(s) { return { todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done' }[s] || s }
function statusColor(s) { return { todo: 'text-slate-400 bg-slate-400/10', in_progress: 'text-blue-400 bg-blue-400/10', in_review: 'text-purple-400 bg-purple-400/10', done: 'text-green-400 bg-green-400/10' }[s] || '' }
function priorityColor(p) { return { urgent: 'text-red-400 bg-red-400/10', high: 'text-orange-400 bg-orange-400/10', medium: 'text-yellow-400 bg-yellow-400/10', low: 'text-slate-400 bg-slate-400/10' }[p] || '' }

export default function Tasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [editTask, setEditTask] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const load = () => tasksAPI.myTasks().then(r => setTasks(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  useEffect(() => {
    let res = tasks
    if (statusFilter !== 'all') res = res.filter(t => t.status === statusFilter)
    if (priorityFilter !== 'all') res = res.filter(t => t.priority === priorityFilter)
    if (search) res = res.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    setFiltered(res)
  }, [tasks, statusFilter, priorityFilter, search])

  const handleStatusChange = async (task, status) => {
    try {
      await tasksAPI.update(task.id, { status })
      load()
    } catch { toast.error('Failed to update') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return
    try {
      await tasksAPI.delete(id)
      toast.success('Task deleted')
      load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-slate-400">
      <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      Loading tasks…
    </div>
  )

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">My Tasks</h1>
          <p className="text-slate-400 text-sm mt-0.5">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          className="input flex-1 min-w-[180px]"
          placeholder="🔍 Search tasks…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s === 'all' ? 'All statuses' : statusLabel(s)}</option>)}
        </select>
        <select className="input w-auto" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          {PRIORITY_OPTS.map(p => <option key={p} value={p}>{p === 'all' ? 'All priorities' : p}</option>)}
        </select>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-5xl mb-3">✅</p>
          <h3 className="font-display font-bold text-white mb-2">No tasks found</h3>
          <p className="text-slate-400 text-sm">Tasks assigned to you will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'done'
            const isDueToday = task.due_date && isToday(new Date(task.due_date))
            return (
              <div key={task.id} className={`card flex items-start gap-4 hover:border-accent/30 transition-all group ${isOverdue ? 'border-red-500/30' : ''}`}>
                {/* Status dropdown */}
                <select
                  value={task.status}
                  onChange={e => handleStatusChange(task, e.target.value)}
                  className={`badge border-0 outline-none bg-transparent ${statusColor(task.status)} flex-shrink-0 mt-0.5`}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="done">Done</option>
                </select>

                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    {task.project && (
                      <span className="text-xs text-slate-500">📁 {task.project.name}</span>
                    )}
                    {task.due_date && (
                      <span className={`text-xs font-mono ${isOverdue ? 'text-red-400 font-semibold' : isDueToday ? 'text-yellow-400' : 'text-slate-500'}`}>
                        {isOverdue ? '⚠️ Overdue · ' : isDueToday ? '🔔 Today · ' : '📅 '}{format(new Date(task.due_date), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge ${priorityColor(task.priority)}`}>{task.priority}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onClick={() => { setEditTask(task); setShowModal(true) }} className="btn-ghost text-xs p-1">✏️</button>
                    <button onClick={() => handleDelete(task.id)} className="btn-ghost text-xs p-1 hover:text-red-400">🗑️</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <TaskModal
          task={editTask}
          projectId={editTask?.project_id}
          members={[]}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load() }}
          editOnly
        />
      )}
    </div>
  )
}
