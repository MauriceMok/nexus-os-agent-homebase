import { useState, useMemo } from 'react'
import { COLUMNS } from '../data/kanban'
import { useAppStore } from '../store/StoreContext'
import { useToast } from './Toast'
import { CreateTaskModal, EditTaskModal } from './TaskModal'
import { ConfirmModal } from './Modal'
import { formatRelative } from '../store/useStore'

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }

export default function KanbanBoard() {
  const { tasks, agents, moveTask, deleteTask, exportData } = useAppStore()
  const toast = useToast()

  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createCol, setCreateCol] = useState('backlog')
  const [editTask, setEditTask] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Filter state
  const [search, setSearch] = useState('')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterAgent, setFilterAgent] = useState('all')

  // Drag handlers
  const handleDragStart = (e, task) => {
    setDragging(task)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e, colId) => { e.preventDefault(); setDragOver(colId) }
  const handleDrop = (e, colId) => {
    e.preventDefault()
    if (!dragging || dragging.col === colId) { setDragging(null); setDragOver(null); return }
    moveTask(dragging.id, colId)
    toast(`Moved "${dragging.title}" → ${colId.toUpperCase()}`, 'success')
    setDragging(null)
    setDragOver(null)
  }
  const handleDragEnd = () => { setDragging(null); setDragOver(null) }

  // Filtered tasks per column
  const colTasks = useMemo(() => {
    const filtered = tasks.filter(t => {
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || (t.desc || '').toLowerCase().includes(search.toLowerCase())
      const matchPriority = filterPriority === 'all' || t.priority === filterPriority
      const matchAgent = filterAgent === 'all' || t.agent === filterAgent
      return matchSearch && matchPriority && matchAgent
    })
    const map = {}
    COLUMNS.forEach(c => {
      map[c.id] = filtered.filter(t => t.col === c.id)
        .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    })
    return map
  }, [tasks, search, filterPriority, filterAgent])

  const totalVisible = Object.values(colTasks).reduce((s, arr) => s + arr.length, 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">COMMAND BOARD</div>
          <div className="page-subtitle">
            {totalVisible} task{totalVisible !== 1 ? 's' : ''} showing · {tasks.length} total · drag & drop between stages
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={exportData}>⬇ EXPORT</button>
          <button className="btn btn-primary" onClick={() => { setCreateCol('backlog'); setShowCreate(true) }}>
            + NEW TASK
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <input
          className="filter-search"
          placeholder="🔍  Search tasks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {['all','critical','high','medium','low'].map(p => (
          <button
            key={p}
            className={`filter-chip priority-${p}${filterPriority === p ? ' active' : ''}`}
            onClick={() => setFilterPriority(p)}
          >
            {p === 'all' ? 'ALL PRIORITY' : p.toUpperCase()}
          </button>
        ))}
        <select
          className="filter-search"
          style={{width:160}}
          value={filterAgent}
          onChange={e => setFilterAgent(e.target.value)}
        >
          <option value="all">All Agents</option>
          {agents.map(a => <option key={a.id} value={a.id}>{a.avatar} {a.name}</option>)}
        </select>
      </div>

      <div className="kanban-board">
        {COLUMNS.map(col => {
          const list = colTasks[col.id] || []
          return (
            <div
              key={col.id}
              className="kanban-col"
              style={{
                '--col-color': col.color,
                borderColor: dragOver === col.id ? col.color : undefined,
                boxShadow: dragOver === col.id ? `0 0 20px ${col.color}33` : undefined,
              }}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="kanban-col-header">
                <span className="col-icon">{col.icon}</span>
                <span className="col-label">{col.label}</span>
                <div className="col-count-wrap">
                  <div className="col-count-bg" style={{ background: col.color }} />
                  <div className="col-count-num" style={{ color: col.color }}>{list.length}</div>
                </div>
              </div>

              <div className="kanban-col-body">
                {list.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    agents={agents}
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    isDragging={dragging?.id === task.id}
                    onEdit={() => setEditTask(task)}
                    onDelete={() => setDeleteConfirm(task)}
                  />
                ))}
                {list.length === 0 && (
                  <div style={{
                    textAlign:'center',padding:'24px 12px',
                    fontFamily:'var(--font-mono)',fontSize:10,
                    color:'var(--text-muted)',
                    border:'1px dashed var(--border)',borderRadius:'var(--radius-sm)',
                  }}>
                    Drop tasks here
                  </div>
                )}
              </div>

              <button
                className="kanban-add-btn"
                onClick={() => { setCreateCol(col.id); setShowCreate(true) }}
              >
                + Add Task
              </button>
            </div>
          )
        })}
      </div>

      {showCreate && (
        <CreateTaskModal
          defaultCol={createCol}
          onClose={() => setShowCreate(false)}
        />
      )}
      {editTask && (
        <EditTaskModal
          task={editTask}
          onClose={() => setEditTask(null)}
        />
      )}
      {deleteConfirm && (
        <ConfirmModal
          title="DELETE TASK"
          message={`Are you sure you want to delete "${deleteConfirm.title}"? This cannot be undone.`}
          danger
          onConfirm={() => {
            deleteTask(deleteConfirm.id)
            toast(`Task deleted`, 'info')
          }}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}

function TaskCard({ task, agents, onDragStart, onDragEnd, isDragging, onEdit, onDelete }) {
  const agent = agents.find(a => a.id === task.agent)
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div
      className={`kanban-card card-priority-${task.priority}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{ opacity: isDragging ? 0.35 : 1, transform: isDragging ? 'rotate(2deg) scale(0.97)' : undefined }}
    >
      <div className="card-top">
        <span className="card-title">{task.title}</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
          <span className={`card-priority-badge badge-${task.priority}`}>{task.priority}</span>
          <div style={{ position: 'relative' }}>
            <button
              className="card-menu-btn"
              onClick={(e) => { e.stopPropagation(); setShowMenu(p => !p) }}
            >⋯</button>
            {showMenu && (
              <div className="card-menu" onClick={e => e.stopPropagation()}>
                <div className="card-menu-item" onClick={() => { onEdit(); setShowMenu(false) }}>✏ Edit</div>
                <div className="card-menu-item danger" onClick={() => { onDelete(); setShowMenu(false) }}>✕ Delete</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {task.desc && <div className="card-desc">{task.desc}</div>}

      {task.tags?.length > 0 && (
        <div className="card-tags">
          {task.tags.map(tag => <span className="card-tag" key={tag}>#{tag}</span>)}
        </div>
      )}

      <div className="card-footer">
        {agent ? (
          <>
            <div className="card-agent-avatar" title={agent.name}>{agent.avatar}</div>
            <span className="card-agent-name" style={{ color: agent.color }}>{agent.name}</span>
          </>
        ) : (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>Unassigned</span>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
          {task.col === 'deployed' && task.deployedAt ? (
            <div className="card-eta" style={{ color: 'var(--green)' }}>
              <span>🚀</span><span>{formatRelative(task.deployedAt)}</span>
            </div>
          ) : (
            <div className="card-eta"><span>⏱</span><span>{task.eta}</span></div>
          )}
          <div className="card-eta" style={{ color: 'var(--text-muted)' }}>
            <span>📅</span><span>{formatRelative(task.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
