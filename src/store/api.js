// ── API Client — all CRUD goes through the backend server ────────────────────
// In dev: Vite proxies /api → localhost:3001
// In prod: Express serves both static files and API on same port
const API_BASE = '/api'

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

// ── Full state ────────────────────────────────────────────────────────────────
export async function fetchState() {
  return request('/state')
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export async function fetchTasks() {
  return request('/tasks')
}

export async function createTask(data) {
  return request('/tasks', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateTask(id, patch) {
  return request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

export async function deleteTask(id) {
  return request(`/tasks/${id}`, { method: 'DELETE' })
}

// ── Agents ────────────────────────────────────────────────────────────────────
export async function fetchAgents() {
  return request('/agents')
}

export async function createAgent(data) {
  return request('/agents', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateAgent(id, patch) {
  return request(`/agents/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

export async function deleteAgent(id) {
  return request(`/agents/${id}`, { method: 'DELETE' })
}

// ── Missions ──────────────────────────────────────────────────────────────────
export async function fetchMissions() {
  return request('/missions')
}

export async function createMission(data) {
  return request('/missions', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateMission(id, patch) {
  return request(`/missions/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

export async function deleteMission(id) {
  return request(`/missions/${id}`, { method: 'DELETE' })
}

// ── Events ────────────────────────────────────────────────────────────────────
export async function fetchEvents(limit = 200) {
  return request(`/events?limit=${limit}`)
}

export async function clearEvents() {
  return request('/events', { method: 'DELETE' })
}

// ── Reset ─────────────────────────────────────────────────────────────────────
export async function resetData() {
  return request('/reset', { method: 'POST' })
}
