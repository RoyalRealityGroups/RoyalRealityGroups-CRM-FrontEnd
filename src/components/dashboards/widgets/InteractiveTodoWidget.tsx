import { useState, useEffect, useCallback } from 'react'
import {
  Add as Plus,
  CheckCircle as CheckCircle2,
  RadioButtonUnchecked as Circle,
  Schedule as Clock,
  HourglassEmpty as Loader2,
  List as ListTodo,
  PushPin as Pin,
  Star,
  ArrowForward as ArrowRight,
  Close as X,
  Pause as PauseCircle,
  Block as Ban,
  Delete as Trash2,
} from '@mui/icons-material';
import { todosApi } from '../../../api/dashboards.api';

const STATUS_CONFIG: Record<string, { icon: any; text: string; bg: string; border: string }> = {
  pending: { icon: Circle, text: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' },
  in_progress: { icon: Clock, text: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
  completed: { icon: CheckCircle2, text: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
  on_hold: { icon: PauseCircle, text: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
  cancelled: { icon: Ban, text: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
}

const PRIORITY_CONFIG: Record<string, { dot: string }> = {
  urgent: { dot: 'bg-red-500' },
  high: { dot: 'bg-orange-500' },
  medium: { dot: 'bg-blue-500' },
  low: { dot: 'bg-gray-400' },
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'text-gray-500' },
  { value: 'medium', label: 'Medium', color: 'text-blue-500' },
  { value: 'high', label: 'High', color: 'text-orange-500' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-500' },
]

interface InteractiveTodoWidgetProps {
  widget: any
}

const InteractiveTodoWidget = ({ widget }: InteractiveTodoWidgetProps) => {
  const [todos, setTodos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [newDueDate, setNewDueDate] = useState('')
  const [adding, setAdding] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const config = widget.config || {}
  const showPriority = config.showPriority !== false
  const showDueDate = config.showDueDate !== false

  const fetchTodos = useCallback(async () => {
    try {
      const params: Record<string, any> = { page_size: 50, ordering: '-is_pinned,-is_starred,-created_at' }
      if (widget.filters) {
        Object.entries(widget.filters).forEach(([k, v]) => {
          if (v) params[k] = String(v)
        })
      }
      const res = await todosApi.list(params)
      if (res.success) {
        setTodos(res.data?.results || res.data as any || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [widget.filters])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    setAdding(true)
    try {
      const data: any = {
        title: newTitle.trim(),
        priority: newPriority,
        status: 'pending',
      }
      if (newDueDate) data.due_date = newDueDate

      const res = await todosApi.create(data)
      if (res.success) {
        setNewTitle('')
        setNewPriority('medium')
        setNewDueDate('')
        setShowAddForm(false)
        await fetchTodos()
      }
    } catch {
      // silent
    } finally {
      setAdding(false)
    }
  }

  const handleToggleComplete = async (todo: any) => {
    setTogglingId(todo.id)
    try {
      if (todo.status === 'completed') {
        await todosApi.incomplete(todo.id)
      } else {
        await todosApi.complete(todo.id)
      }
      await fetchTodos()
    } catch {
      // silent
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (todo: any) => {
    setDeletingId(todo.id)
    try {
      await todosApi.delete(todo.id)
      setTodos((prev) => prev.filter((t) => t.id !== todo.id))
    } catch {
      // silent
    } finally {
      setDeletingId(null)
    }
  }

  const handleTodoClick = (todo: any) => {
    window.dispatchEvent(new CustomEvent('widget-navigate', {
      detail: { type: 'todo', id: todo.id }
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Quick Add Bar */}
      <div className="flex-shrink-0 px-3 pt-3 pb-2">
        {showAddForm ? (
          <form onSubmit={handleAdd} className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setNewTitle(''); setNewDueDate(''); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-500 outline-none"
              >
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              {showDueDate && (
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                />
              )}
              <div className="flex-1" />
              <button
                type="submit"
                disabled={!newTitle.trim() || adding}
                className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
              >
                {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Add
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Todo
          </button>
        )}
      </div>

      {/* Todo List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
        {todos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <ListTodo className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No todos yet</p>
            <p className="text-xs mt-1">Click "Add Todo" to get started</p>
          </div>
        ) : (
          todos.map((todo: any) => {
            const statusStyle = STATUS_CONFIG[todo.status] || STATUS_CONFIG.pending
            const priorityStyle = PRIORITY_CONFIG[todo.priority] || PRIORITY_CONFIG.medium
            const isToggling = togglingId === todo.id
            const isCompleted = todo.status === 'completed'

            return (
              <div
                key={todo.id}
                className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all hover:shadow-sm group ${statusStyle.bg} ${statusStyle.border}`}
              >
                {/* Toggle Complete */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleToggleComplete(todo); }}
                  disabled={isToggling}
                  className={`flex-shrink-0 transition-colors ${isCompleted ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-green-500'}`}
                  title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                >
                  {isToggling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>

                {/* Todo Content */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => handleTodoClick(todo)}
                >
                  <div className="flex items-center gap-1.5">
                    {showPriority && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityStyle.dot}`}
                        title={todo.priority}
                      />
                    )}
                    {todo.is_pinned && <Pin className="w-3 h-3 text-gray-500 flex-shrink-0" />}
                    {todo.is_starred && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                    <span className={`truncate text-sm font-medium ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'} group-hover:text-gray-700`}>
                      {todo.title}
                    </span>
                  </div>
                  {showDueDate && todo.due_date && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {new Date(todo.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions on hover */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDelete(todo); }}
                    disabled={deletingId === todo.id}
                    className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                    title="Delete todo"
                  >
                    {deletingId === todo.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default InteractiveTodoWidget
