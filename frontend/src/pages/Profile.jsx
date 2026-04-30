import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { usersAPI } from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const AVATARS = ['👤', '🧑‍💻', '👩‍💻', '🧑‍🎨', '👩‍🎨', '🧑‍🔬', '👩‍🔬', '🧑‍💼', '👩‍💼', '🦊', '🐼', '🐸', '🦁', '🐯', '🦋']

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', avatar: user?.avatar || '👤' })
  const [loading, setLoading] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await usersAPI.updateMe(form)
      updateUser(data)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-white mb-8">Profile</h1>

      <div className="card">
        {/* Current info */}
        <div className="flex items-center gap-4 pb-6 border-b border-border mb-6">
          <div className="w-16 h-16 rounded-2xl bg-surface-3 flex items-center justify-center text-4xl">
            {user?.avatar}
          </div>
          <div>
            <p className="font-display font-bold text-xl text-white">{user?.name}</p>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge text-xs ${user?.role === 'admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-500/10 text-slate-400'}`}>
                {user?.role}
              </span>
              <span className="text-xs text-slate-600">
                Joined {user?.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="label">Display Name</label>
            <input
              type="text"
              className="input"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="label">Avatar</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {AVATARS.map(av => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, avatar: av }))}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                    form.avatar === av
                      ? 'bg-accent/20 border-2 border-accent scale-110'
                      : 'bg-surface-2 border border-border hover:border-accent/40'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Info box */}
      <div className="card mt-4 border-dashed bg-transparent">
        <p className="text-sm text-slate-500">
          ℹ️ Email and role cannot be changed from profile. Contact an admin for role changes.
        </p>
      </div>
    </div>
  )
}
