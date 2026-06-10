import { useState, useEffect, useCallback, useRef } from 'react'
import * as api from './api'

// ── ID generator (fallback when offline) ─────────────────────────────────────
let _counter = Date.now()
export const genId = (prefix = 'id') => `${prefix}-${(++_counter).toString(36)}`

// ── Timestamp helpers ────────────────────────────────────────────────────────
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

// ── Time formatter ───────────────────────────────────────────────────────────
export const formatTime = () => {
  const now = new Date()
  return [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map(n => String(n).padStart(2, '0')).join(':')
}

// ── Polling interval (ms) — keep UI in sync with server ──────────────────────
const POLL_INTERVAL = 3000

// ── useStore hook — API-backed single source of truth ────────────────────────
export function useStore() {
  const [tasks, setTasks] = useState([])
  const [agents, setAgents] = useState([])
  const [missions, setMissions] = useState([])
  const [taskHistory, setTaskHistory] = useState({})
  const [events, setEvents] = useState([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  // Keep refs for closures
  const agentsRef = useRef(agents)
  agentsRef.current = agents

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const state = await api.fetchState()
        if (cancelled) return
        setTasks(state.tasks || [])
        setAgents(state.agents || [])
        setMissions(state.missions || [])
        setTaskHistory(state.taskHistory || {})
        setEvents(state.events || [])
        setReady(true)
        setError(null)
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load state from API:', err)
          setError('Cannot connect to NEXUS OS server. Make sure the backend is running on port 3001.')
          setReady(true)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // ── Polling — keep state fresh ─────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return
    const interval = setInterval(async () => {
      try {
        const state = await api.fetchState()
        setTasks(state.tasks || [])
        setAgents(state.agents || [])
        setMissions(state.missions || [])
        setTaskHistory(state.taskHistory || {})
        setEvents(state.events || [])
        setError(null)
      } catch {
        // Silently ignore poll errors — will retry next interval
      }
    }, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [ready])

  // ── Task CRUD ──────────────────────────────────────────────────────────────
  const createTask = useCallback(async (data) => {
    const task = await api.createTask(data)
    return task
  }, [])

  const updateTask = useCallback(async (id, patch) => {
    const task = await api.updateTask(id, patch)
    return task
  }, [])

  const deleteTask = useCallback(async (id) => {
    await api.deleteTask(id)
  }, [])

  const moveTask = useCallback(async (id, newCol) => {
    const task = await api.updateTask(id, { col: newCol })
    return task
  }, [])

  // ── Agent CRUD ─────────────────────────────────────────────────────────────
  const createAgent = useCallback(async (data) => {
    const agent = await api.createAgent(data)
    return agent
  }, [])

  const updateAgent = useCallback(async (id, patch) => {
    const agent = await api.updateAgent(id, patch)
    return agent
  }, [])

  const deleteAgent = useCallback(async (id) => {
    await api.deleteAgent(id)
  }, [])

  // ── Mission CRUD ───────────────────────────────────────────────────────────
  const createMission = useCallback(async (data) => {
    const mission = await api.createMission(data)
    return mission
  }, [])

  const updateMission = useCallback(async (id, patch) => {
    const mission = await api.updateMission(id, patch)
    return mission
  }, [])

  const deleteMission = useCallback(async (id) => {
    await api.deleteMission(id)
  }, [])

  // ── Events ─────────────────────────────────────────────────────────────────
  const clearEvents = useCallback(async () => {
    await api.clearEvents()
  }, [])

  const emitEvent = useCallback((_kind, _msg, _agentId) => {
    // Events are now emitted server-side — this is a no-op on the client
    // Kept for backward compatibility with components that call it
  }, [])

  // ── Export ─────────────────────────────────────────────────────────────────
  const exportData = useCallback(() => {
    const data = { tasks, agents, missions, taskHistory, events, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nexus-export-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [tasks, agents, missions, taskHistory, events])

  // ── Reset ──────────────────────────────────────────────────────────────────
  const resetData = useCallback(async () => {
    await api.resetData()
  }, [])

  // ── Derived live counts ────────────────────────────────────────────────────
  const getAgentLiveCounts = useCallback((agentId) => {
    const activeTasks = tasks.filter(t => t.agent === agentId && t.col !== 'deployed').length
    return { tasks: activeTasks }
  }, [tasks])

  return {
    tasks, agents, missions, taskHistory, events, ready, error,
    createTask, updateTask, deleteTask, moveTask,
    createAgent, updateAgent, deleteAgent,
    createMission, updateMission, deleteMission,
    exportData, resetData, emitEvent, clearEvents,
    getAgentLiveCounts,
    formatRelative,
  }
}
