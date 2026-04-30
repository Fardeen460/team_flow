import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const AVATARS = ['👤', '🧑‍💻', '👩‍💻', '🧑‍🎨', '👩‍🎨', '🧑‍🔬', '👩‍🔬', '🧑‍💼', '👩‍💼', '🦊', '🐼', '🐸']

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member', avatar: '👤' })
  const [loading, setLoading] = useState(false)
  const [showAvatars, setShowAvatars] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await signup(form)
      toast.success('Account created!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white font-display font-bold">T</div>
            <span className="font-display font-bold text-2xl text-white tracking-tight">TeamFlow</span>
          </div>
          <p className="text-slate-400 text-sm">Create your account</p>
        </div>

        <div className="card">
          <h1 className="font-display text-xl font-bold text-white mb-6">Get started</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar picker */}
            <div>
              <label className="label">Avatar</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAvatars(!showAvatars)}
                  className="w-11 h-11 bg-surface-2 border border-border rounded-xl flex items-center justify-center text-2xl hover:border-accent transition-colors"
                >
                  {form.avatar}
                </button>
                {showAvatars && (
                  <div className="flex flex-wrap gap-2">
                    {AVATARS.map(av => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => { setForm(p => ({ ...p, avatar: av })); setShowAvatars(false) }}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                          form.avatar === av ? 'bg-accent/20 border border-accent' : 'bg-surface-2 hover:bg-surface-3'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="label">Full name</label>
              <input
                type="text"
                className="input"
                placeholder="Jane Smith"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@company.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Role</label>
              <select
                className="input"
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button type="submit" className="btn-primary w-full justify-center mt-2" disabled={loading}>
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-border text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:text-accent-hover font-medium transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
