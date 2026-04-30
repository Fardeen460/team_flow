import { format, isPast, isToday } from 'date-fns'

function priorityColor(p) {
  return { urgent: 'text-red-400 bg-red-400/10 border-red-400/20', high: 'text-orange-400 bg-orange-400/10 border-orange-400/20', medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', low: 'text-slate-400 bg-slate-400/10 border-slate-400/20' }[p] || ''
}

const STATUSES = ['todo', 'in_progress', 'in_review', 'done']

export default function TaskCard({ task, onEdit, onDelete, onStatusChange, canManage }) {
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'done'
  const isDueToday = task.due_date && isToday(new Date(task.due_date))

  return (
    <div className={`
      bg-surface-2 border rounded-xl p-3 group hover:border-accent/40 transition-all
      ${isOverdue ? 'border-red-500/40 bg-red-500/5' : 'border-border'}
    `}>
      {/* Priority badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`badge border ${priorityColor(task.priority)} text-xs flex-shrink-0`}>
          {task.priority}
        </span>
        {canManage && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button onClick={onEdit} className="text-slate-500 hover:text-accent text-xs p-0.5 rounded transition-colors">✏️</button>
            <button onClick={onDelete} className="text-slate-500 hover:text-red-400 text-xs p-0.5 rounded transition-colors">🗑️</button>
          </div>
        )}
      </div>

      {/* Title */}
      <p className={`text-sm font-medium leading-snug mb-2 ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-100'}`}>
        {task.title}
      </p>

      {task.description && (
        <p className="text-xs text-slate-500 mb-2 line-clamp-2">{task.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
        {/* Assignee */}
        {task.assignee ? (
          <div className="flex items-center gap-1.5" title={task.assignee.name}>
            <span className="w-5 h-5 rounded-full bg-surface-3 flex items-center justify-center text-xs">{task.assignee.avatar}</span>
            <span className="text-xs text-slate-500 truncate max-w-[80px]">{task.assignee.name.split(' ')[0]}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-600">Unassigned</span>
        )}

        {/* Due date */}
        {task.due_date ? (
          <span className={`text-xs font-mono ${isOverdue ? 'text-red-400 font-semibold' : isDueToday ? 'text-yellow-400' : 'text-slate-500'}`}>
            {isOverdue ? '⚠️ ' : isDueToday ? '🔔 ' : ''}{format(new Date(task.due_date), 'MMM d')}
          </span>
        ) : null}
      </div>

      {/* Quick status move */}
      {onStatusChange && (
        <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <select
            value={task.status}
            onChange={e => onStatusChange(e.target.value)}
            onClick={e => e.stopPropagation()}
            className="w-full text-xs bg-surface-3 border border-border text-slate-400 rounded-lg px-2 py-1 outline-none focus:border-accent transition-colors"
          >
            <option value="todo">→ To Do</option>
            <option value="in_progress">→ In Progress</option>
            <option value="in_review">→ In Review</option>
            <option value="done">→ Done</option>
          </select>
        </div>
      )}
    </div>
  )
}
