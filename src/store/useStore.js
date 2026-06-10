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

// ── useStore hook (single source of truth) ───────────────────────────────────
export function useStore() {
  const [tasks, setTasksRaw] = useState(() => load('nexus_tasks', INITIAL_TASKS))
  const [agents, setAgentsRaw] = useState(() => load('nexus_agents', DEFAULT_AGENTS))
  const [missions, setMissionsRaw] = useState(() => load('nexus_missions', DEFAULT_MISSIONS))

  // persist on every change
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
      created: 'just now',
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

  const moveTask = useCallback((id, col) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, col } : t))
  }, [setTasks])

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
    const data = { tasks, agents, missions, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nexus-export-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [tasks, agents, missions])

  const resetData = useCallback(() => {
    save('nexus_tasks', INITIAL_TASKS)
    save('nexus_agents', DEFAULT_AGENTS)
    save('nexus_missions', DEFAULT_MISSIONS)
    setTasksRaw(INITIAL_TASKS)
    setAgentsRaw(DEFAULT_AGENTS)
    setMissionsRaw(DEFAULT_MISSIONS)
  }, [])

  return {
    tasks, agents, missions,
    createTask, updateTask, deleteTask, moveTask,
    createAgent, updateAgent, deleteAgent,
    createMission, updateMission, deleteMission,
    exportData, resetData,
  }
}
