import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { tasksAPI, projectsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { format, isPast, isToday } from 'date-fns'

function StatCard({ label, value, color, icon }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-white">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
      </div>
    </div>
  )
}

function priorityColor(p) {
  return { urgent: 'text-red-400 bg-red-400/10', high: 'text-orange-400 bg-orange-400/10', medium: 'text-yellow-400 bg-yellow-400/10', low: 'text-slate-400 bg-slate-400/10' }[p] || ''
}

function statusColor(s) {
  return { todo: 'text-slate-400 bg-slate-400/10', in_progress: 'text-blue-400 bg-blue-400/10', in_review: 'text-purple-400 bg-purple-400/10', done: 'text-green-400 bg-green-400/10' }[s] || ''
}

function statusLabel(s) {
  return { todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done' }[s] || s
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [myTasks, setMyTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      tasksAPI.dashboard(),
      tasksAPI.myTasks(),
      projectsAPI.list(),
    ]).then(([s, t, p]) => {
      setStats(s.data)
      setMyTasks(t.data.slice(0, 8))
      setProjects(p.data.slice(0, 4))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-slate-400">
      <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      Loading dashboard…
    </div>
  )

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-slate-500 text-sm">{greeting},</p>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-white mt-0.5">
          {user?.avatar} {user?.name}
        </h1>
        <p className="text-slate-400 text-sm mt-1">Here's what's happening across your projects.</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Projects" value={stats.total_projects} icon="📁" color="bg-blue-500/10" />
          <StatCard label="Total Tasks" value={stats.total_tasks} icon="📋" color="bg-accent/10" />
          <StatCard label="Completed" value={stats.completed_tasks} icon="✅" color="bg-green-500/10" />
          <StatCard label="In Progress" value={stats.in_progress_tasks} icon="⚡" color="bg-yellow-500/10" />
          <StatCard label="To Do" value={stats.todo_tasks} icon="📌" color="bg-slate-500/10" />
          <StatCard label="Overdue" value={stats.overdue_tasks} icon="🔴" color="bg-red-500/10" />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* My Tasks */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-white">My Tasks</h2>
            <Link to="/tasks" className="text-xs text-accent hover:text-accent-hover transition-colors">View all →</Link>
          </div>
          <div className="space-y-2">
            {myTasks.length === 0 ? (
              <div className="card text-center py-8 text-slate-500">
                <p className="text-3xl mb-2">🎉</p>
                <p>No tasks assigned to you yet.</p>
              </div>
            ) : myTasks.map(task => {
              const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'done'
              const isDueToday = task.due_date && isToday(new Date(task.due_date))
              return (
                <div key={task.id} className="card flex items-center gap-3 py-3 hover:border-accent/40 transition-all">
                  <span className={`badge ${statusColor(task.status)}`}>{statusLabel(task.status)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {task.title}
                    </p>
                    {task.project && (
                      <p className="text-xs text-slate-500 truncate">{task.project.name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`badge ${priorityColor(task.priority)}`}>{task.priority}</span>
                    {task.due_date && (
                      <span className={`text-xs font-mono ${isOverdue ? 'text-red-400' : isDueToday ? 'text-yellow-400' : 'text-slate-500'}`}>
                        {isOverdue ? '⚠️ ' : ''}{format(new Date(task.due_date), 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-white">Projects</h2>
            <Link to="/projects" className="text-xs text-accent hover:text-accent-hover transition-colors">View all →</Link>
          </div>
          <div className="space-y-3">
            {projects.length === 0 ? (
              <div className="card text-center py-8 text-slate-500">
                <p className="text-3xl mb-2">📁</p>
                <p>No projects yet.</p>
                <Link to="/projects" className="text-accent text-sm mt-2 block">Create one →</Link>
              </div>
            ) : projects.map(p => {
              const pct = p.task_count > 0 ? Math.round((p.completed_count / p.task_count) * 100) : 0
              return (
                <Link key={p.id} to={`/projects/${p.id}`} className="card block hover:border-accent/40 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color }} />
                    <p className="font-medium text-sm text-slate-200 truncate">{p.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-mono text-slate-500">{pct}%</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{p.task_count} tasks · {p.members.length} members</p>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
