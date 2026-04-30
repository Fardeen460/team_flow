import { useState, useEffect } from 'react'
import { usersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function Team() {
  const { isAdmin, user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = () => usersAPI.list().then(r => setUsers(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleRoleChange = async (userId, role) => {
    try {
      await usersAPI.updateRole(userId, { role })
      toast.success('Role updated')
      load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  const handleDeactivate = async (userId) => {
    if (!confirm('Deactivate this user?')) return
    try {
      await usersAPI.deactivate(userId)
      toast.success('User deactivated')
      load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-slate-400">
      <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      Loading team…
    </div>
  )

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Team</h1>
          <p className="text-slate-400 text-sm mt-0.5">{users.length} member{users.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="card mb-5">
        <input
          type="text"
          className="input"
          placeholder="🔍 Search team members…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        {filtered.map(u => (
          <div key={u.id} className={`card flex items-center gap-4 ${!u.is_active ? 'opacity-40' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center text-xl flex-shrink-0">
              {u.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm text-slate-100">{u.name}</p>
                {u.id === me?.id && <span className="badge bg-accent/10 text-accent text-xs">You</span>}
                {!u.is_active && <span className="badge bg-red-500/10 text-red-400 text-xs">Inactive</span>}
              </div>
              <p className="text-xs text-slate-500">{u.email}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs text-slate-500 hidden sm:block">
                Joined {format(new Date(u.created_at), 'MMM d, yyyy')}
              </span>
              {isAdmin && u.id !== me?.id ? (
                <>
                  <select
                    value={u.role}
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                    className="badge border border-border bg-surface-2 text-slate-300 outline-none px-2 py-1 rounded-lg"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  {u.is_active && (
                    <button
                      onClick={() => handleDeactivate(u.id)}
                      className="btn-ghost text-xs text-slate-500 hover:text-red-400"
                    >
                      Deactivate
                    </button>
                  )}
                </>
              ) : (
                <span className={`badge ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-500/10 text-slate-400'}`}>
                  {u.role}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isAdmin && (
        <div className="mt-6 card bg-surface-1/50 border-dashed">
          <p className="text-sm text-slate-500 text-center">
            🛡️ Contact an admin to change roles or manage team members.
          </p>
        </div>
      )}
    </div>
  )
}
