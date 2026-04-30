import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { projectsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import ProjectModal from '../components/ProjectModal'

const COLORS = ['#7c6aff', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4']

export default function Projects() {
  const { isAdmin, user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editProject, setEditProject] = useState(null)

  const load = () => projectsAPI.list().then(r => setProjects(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return
    try {
      await projectsAPI.delete(id)
      toast.success('Project deleted')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete')
    }
  }

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-slate-400">
      <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      Loading projects…
    </div>
  )

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 text-sm mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setEditProject(null); setShowModal(true) }} className="btn-primary">
          <span>+</span> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">📁</p>
          <h3 className="font-display font-bold text-white mb-2">No projects yet</h3>
          <p className="text-slate-400 text-sm mb-6">Create your first project to start tracking tasks.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">+ Create Project</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map(project => {
            const pct = project.task_count > 0 ? Math.round((project.completed_count / project.task_count) * 100) : 0
            const canEdit = isAdmin || project.owner_id === user?.id
            return (
              <div key={project.id} className="card group hover:border-accent/40 transition-all duration-200 flex flex-col">
                {/* Color bar */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: project.color }} />
                    <h3 className="font-semibold text-white text-sm truncate max-w-[160px]">{project.name}</h3>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditProject(project); setShowModal(true) }}
                        className="btn-ghost text-xs px-2 py-1"
                        title="Edit"
                      >✏️</button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="btn-ghost text-xs px-2 py-1 hover:text-red-400"
                        title="Delete"
                      >🗑️</button>
                    </div>
                  )}
                </div>

                {project.description && (
                  <p className="text-xs text-slate-400 mb-4 line-clamp-2">{project.description}</p>
                )}

                {/* Progress */}
                <div className="mt-auto">
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>{project.completed_count}/{project.task_count} tasks</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden mb-4">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: project.color }} />
                  </div>

                  {/* Members */}
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {project.members.slice(0, 5).map(m => (
                        <div key={m.id} title={m.name} className="w-7 h-7 rounded-full bg-surface-3 border-2 border-surface-1 flex items-center justify-center text-sm">
                          {m.avatar}
                        </div>
                      ))}
                      {project.members.length > 5 && (
                        <div className="w-7 h-7 rounded-full bg-surface-3 border-2 border-surface-1 flex items-center justify-center text-xs text-slate-400">
                          +{project.members.length - 5}
                        </div>
                      )}
                    </div>
                    <Link to={`/projects/${project.id}`} className="text-xs text-accent hover:text-accent-hover font-medium transition-colors">
                      Open →
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <ProjectModal
          project={editProject}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load() }}
        />
      )}
    </div>
  )
}
