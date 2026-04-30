import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectsAPI, tasksAPI, usersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import TaskModal from '../components/TaskModal'
import TaskCard from '../components/TaskCard'

const STATUSES = [
  { key: 'todo', label: 'To Do', icon: '📌', color: 'text-slate-400 bg-slate-400/10 border-slate-400/20' },
  { key: 'in_progress', label: 'In Progress', icon: '⚡', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { key: 'in_review', label: 'In Review', icon: '🔍', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  { key: 'done', label: 'Done', icon: '✅', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
]

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()

  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [activeStatus, setActiveStatus] = useState(null)
  const [addMemberEmail, setAddMemberEmail] = useState('')
  const [showMemberPanel, setShowMemberPanel] = useState(false)

  const loadProject = () => projectsAPI.get(id).then(r => setProject(r.data))
  const loadTasks = () => tasksAPI.list({ project_id: id }).then(r => setTasks(r.data))

  useEffect(() => {
    Promise.all([loadProject(), loadTasks(), usersAPI.list().then(r => setAllUsers(r.data))])
      .catch(() => { toast.error('Project not found'); navigate('/projects') })
      .finally(() => setLoading(false))
  }, [id])

  const handleAddMember = async (userId) => {
    try {
      await projectsAPI.addMember(id, { user_id: userId })
      toast.success('Member added')
      loadProject()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add member')
    }
  }

  const handleRemoveMember = async (userId) => {
    try {
      await projectsAPI.removeMember(id, userId)
      toast.success('Member removed')
      loadProject()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to remove')
    }
  }

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-slate-400">
      <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      Loading project…
    </div>
  )
  if (!project) return null

  const canManage = isAdmin || project.owner_id === user?.id
  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s.key] = tasks.filter(t => t.status === s.key)
    return acc
  }, {})

  const nonMembers = allUsers.filter(u => !project.members.find(m => m.id === u.id))

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/projects')} className="btn-ghost text-slate-500">← Back</button>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full" style={{ background: project.color }} />
            <h1 className="font-display text-2xl font-bold text-white">{project.name}</h1>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canManage && (
            <button onClick={() => setShowMemberPanel(!showMemberPanel)} className="btn-secondary text-sm">
              👥 Members ({project.members.length})
            </button>
          )}
          <button
            onClick={() => { setEditTask(null); setActiveStatus('todo'); setShowTaskModal(true) }}
            className="btn-primary text-sm"
          >
            <span>+</span> Add Task
          </button>
        </div>
      </div>

      {project.description && (
        <p className="text-slate-400 text-sm mb-6 max-w-2xl">{project.description}</p>
      )}

      {/* Member panel */}
      {showMemberPanel && (
        <div className="card mb-6 animate-slide-up">
          <h3 className="font-semibold text-white mb-4">Team Members</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {project.members.map(m => (
              <div key={m.id} className="flex items-center gap-2 bg-surface-2 border border-border rounded-lg px-3 py-1.5">
                <span>{m.avatar}</span>
                <span className="text-sm text-slate-200">{m.name}</span>
                <span className="badge text-xs bg-accent/10 text-accent">{m.role}</span>
                {canManage && m.id !== project.owner_id && (
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    className="text-slate-500 hover:text-red-400 ml-1 text-xs"
                  >✕</button>
                )}
              </div>
            ))}
          </div>
          {nonMembers.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Add members:</p>
              <div className="flex flex-wrap gap-2">
                {nonMembers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleAddMember(u.id)}
                    className="flex items-center gap-2 bg-surface-2 hover:bg-surface-3 border border-border rounded-lg px-3 py-1.5 text-sm text-slate-300 transition-all"
                  >
                    <span>{u.avatar}</span> {u.name} <span className="text-accent">+</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {STATUSES.map(status => (
          <div key={status.key} className="flex flex-col">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border mb-3 ${status.color}`}>
              <span>{status.icon}</span>
              <span className="text-sm font-medium">{status.label}</span>
              <span className="ml-auto text-xs font-mono opacity-70">{tasksByStatus[status.key].length}</span>
            </div>

            <div className="space-y-2 flex-1">
              {tasksByStatus[status.key].map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => { setEditTask(task); setShowTaskModal(true) }}
                  onDelete={() => {
                    tasksAPI.delete(task.id).then(() => { toast.success('Task deleted'); loadTasks() })
                  }}
                  onStatusChange={(newStatus) => {
                    tasksAPI.update(task.id, { status: newStatus }).then(loadTasks)
                  }}
                  canManage={canManage || task.creator_id === user?.id}
                />
              ))}
              <button
                onClick={() => { setEditTask(null); setActiveStatus(status.key); setShowTaskModal(true) }}
                className="w-full py-2 text-xs text-slate-600 hover:text-slate-400 hover:bg-surface-2 rounded-lg border border-dashed border-surface-4 hover:border-slate-600 transition-all"
              >
                + Add task
              </button>
            </div>
          </div>
        ))}
      </div>

      {showTaskModal && (
        <TaskModal
          task={editTask}
          projectId={id}
          defaultStatus={activeStatus}
          members={project.members}
          onClose={() => setShowTaskModal(false)}
          onSaved={() => { setShowTaskModal(false); loadTasks() }}
        />
      )}
    </div>
  )
}
