import { useState, useEffect, useCallback } from 'react'
import { INITIAL_TASKS } from '../data/kanban'
import { AGENTS as DEFAULT_AGENTS } from '../data/agents'
import { MISSIONS as DEFAULT_MISSIONS } from '../data/agents'

// ── localStorage helpers ──────────────────────────────────────────────────────
const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}
const save = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

// ── ID generator ─────────────────────────────────────────────────────────────
let _counter = Date.now()
export const genId = (prefix = 'id') => `${prefix}-${(++_counter).toString(36)}`

// ── Timestamp helper ─────────────────────────────────────────────────────────
export const nowTs = () => new Date().toISOString()
export const formatRelative = (isoStr) => {
  if (!isoStr) return 'unknown'
  const diff = Date.now() - new Date(isoStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Seed initial tasks with real timestamps if they don't have them ───────────
const seedTimestamps = (tasks) => tasks.map((t, i) => ({
  ...t,
  createdAt: t.createdAt || new Date(Date.now() - (12 - i) * 3600 * 1000 * 8).toISOString(),
  deployedAt: t.deployedAt || (t.col === 'deployed' ? new Date(Date.now() - i * 3600 * 1000 * 4).toISOString() : null),
}))

// ── Task history record (one entry per day of deployment) ────────────────────
const buildHistory = (tasks) => {
  const map = {}
  tasks.forEach(t => {
    if (t.col === 'deployed' && t.deployedAt) {
      const day = t.deployedAt.slice(0, 10)
      map[day] = (map[day] || 0) + 1
    }
  })
  return map
}

// ── useStore hook (single source of truth) ───────────────────────────────────
export function useStore() {
  const [tasks, setTasksRaw] = useState(() => {
    const raw = load('nexus_tasks', null)
    return seedTimestamps(raw || INITIAL_TASKS)
  })
  const [agents, setAgentsRaw] = useState(() => load('nexus_agents', DEFAULT_AGENTS))
  const [missions, setMissionsRaw] = useState(() => load('nexus_missions', DEFAULT_MISSIONS))
  // taskHistory: { 'YYYY-MM-DD': count } — how many tasks deployed each day
  const [taskHistory, setTaskHistory] = useState(() =>
    load('nexus_task_history', buildHistory(load('nexus_tasks', INITIAL_TASKS)))
  )

  // ── Persist on every change ─────────────────────────────────────────────────
  const setTasks = useCallback((v) => {
    setTasksRaw(prev => {
      const next = typeof v === 'function' ? v(prev) : v
      save('nexus_tasks', next)
      return next
    })
  }, [])
  const setAgents = useCallback((v) => {
    setAgentsRaw(prev => {
      const next = typeof v === 'function' ? v(prev) : v
      save('nexus_agents', next)
      return next
    })
  }, [])
  const setMissions = useCallback((v) => {
    setMissionsRaw(prev => {
      const next = typeof v === 'function' ? v(prev) : v
      save('nexus_missions', next)
      return next
    })
  }, [])
  const setHistory = useCallback((v) => {
    setTaskHistory(prev => {
      const next = typeof v === 'function' ? v(prev) : v
      save('nexus_task_history', next)
      return next
    })
  }, [])

  // ── Derived live counts (always computed from real data) ─────────────────────
  // Recompute agent.tasks (active tasks count) on the fly so it's always live
  // We expose a helper to get an agent's live counts
  const getAgentLiveCounts = useCallback((agentId) => {
    const activeTasks = tasks.filter(t => t.agent === agentId && t.col !== 'deployed').length
    return { tasks: activeTasks }
  }, [tasks])

  // ── Task CRUD ───────────────────────────────────────────────────────────────
  const createTask = useCallback((data) => {
    const task = {
      id: genId('t'),
      col: data.col || 'backlog',
      title: data.title,
      desc: data.desc || '',
      agent: data.agent || null,
      priority: data.priority || 'medium',
      tags: data.tags || [],
      eta: data.eta || '—',
      createdAt: nowTs(),
      deployedAt: null,
    }
    setTasks(prev => [...prev, task])
    return task
  }, [setTasks])

  const updateTask = useCallback((id, patch) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
  }, [setTasks])

  const deleteTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [setTasks])

  // moveTask: the smart one — auto-updates agent completed count & history
  const moveTask = useCallback((id, newCol) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id)
      if (!task || task.col === newCol) return prev

      const wasDeployed = task.col === 'deployed'
      const isNowDeployed = newCol === 'deployed'

      // Update task
      const next = prev.map(t => t.id === id ? {
        ...t,
        col: newCol,
        deployedAt: isNowDeployed ? nowTs() : t.deployedAt,
      } : t)

      // Update agent completed count
      if (task.agent) {
        if (isNowDeployed && !wasDeployed) {
          // Moving INTO deployed: increment completed
          setAgents(agents => agents.map(a =>
            a.id === task.agent
              ? { ...a, completed: (a.completed || 0) + 1, lastAction: 'just now' }
              : a
          ))
          // Record in history
          const today = new Date().toISOString().slice(0, 10)
          setHistory(h => ({ ...h, [today]: (h[today] || 0) + 1 }))
        } else if (wasDeployed && !isNowDeployed) {
          // Moving OUT of deployed: decrement completed
          setAgents(agents => agents.map(a =>
            a.id === task.agent
              ? { ...a, completed: Math.max(0, (a.completed || 0) - 1) }
              : a
          ))
          // Reverse history
          const deployedDay = task.deployedAt ? task.deployedAt.slice(0, 10) : null
          if (deployedDay) {
            setHistory(h => ({ ...h, [deployedDay]: Math.max(0, (h[deployedDay] || 0) - 1) }))
          }
        }
      }

      return next
    })
  }, [setTasks, setAgents, setHistory])

  // ── Agent CRUD ──────────────────────────────────────────────────────────────
  const createAgent = useCallback((data) => {
    const agent = {
      id: genId('agt'),
      name: data.name.toUpperCase(),
      role: data.role,
      specialty: data.specialty || '',
      avatar: data.avatar || '🤖',
      color: data.color || '#00F5FF',
      status: 'standby',
      tasks: 0,
      completed: 0,
      uptime: '100%',
      model: data.model || 'GPT-4o',
      lastAction: 'just deployed',
      tags: data.tags || [],
    }
    setAgents(prev => [...prev, agent])
    return agent
  }, [setAgents])

  const updateAgent = useCallback((id, patch) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a))
  }, [setAgents])

  const deleteAgent = useCallback((id) => {
    setAgents(prev => prev.filter(a => a.id !== id))
  }, [setAgents])

  // ── Mission CRUD ────────────────────────────────────────────────────────────
  const createMission = useCallback((data) => {
    const mission = {
      id: genId('m'),
      label: data.label,
      agents: data.agents || [],
      progress: 0,
      status: 'active',
      due: data.due || '—',
      createdAt: nowTs(),
    }
    setMissions(prev => [...prev, mission])
    return mission
  }, [setMissions])

  const updateMission = useCallback((id, patch) => {
    setMissions(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m))
  }, [setMissions])

  const deleteMission = useCallback((id) => {
    setMissions(prev => prev.filter(m => m.id !== id))
  }, [setMissions])

  // ── Export ──────────────────────────────────────────────────────────────────
  const exportData = useCallback(() => {
    const data = { tasks, agents, missions, taskHistory, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nexus-export-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [tasks, agents, missions, taskHistory])

  const resetData = useCallback(() => {
    const seeded = seedTimestamps(INITIAL_TASKS)
    save('nexus_tasks', seeded)
    save('nexus_agents', DEFAULT_AGENTS)
    save('nexus_missions', DEFAULT_MISSIONS)
    const hist = buildHistory(seeded)
    save('nexus_task_history', hist)
    setTasksRaw(seeded)
    setAgentsRaw(DEFAULT_AGENTS)
    setMissionsRaw(DEFAULT_MISSIONS)
    setTaskHistory(hist)
  }, [])

  return {
    tasks, agents, missions, taskHistory,
    createTask, updateTask, deleteTask, moveTask,
    createAgent, updateAgent, deleteAgent,
    createMission, updateMission, deleteMission,
    exportData, resetData,
    getAgentLiveCounts,
    formatRelative,
  }
}
