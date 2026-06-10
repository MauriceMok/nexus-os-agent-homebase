import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

// ── Database ──────────────────────────────────────────────────────────────────
const db = new Database(join(__dirname, 'nexus.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    specialty TEXT DEFAULT '',
    avatar TEXT DEFAULT '🤖',
    color TEXT DEFAULT '#00F5FF',
    status TEXT DEFAULT 'standby',
    tasks INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 0,
    uptime TEXT DEFAULT '100%',
    model TEXT DEFAULT 'GPT-4o',
    last_action TEXT DEFAULT 'just deployed',
    tags TEXT DEFAULT '[]',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    col TEXT NOT NULL DEFAULT 'backlog',
    title TEXT NOT NULL,
    desc TEXT DEFAULT '',
    agent TEXT,
    priority TEXT DEFAULT 'medium',
    tags TEXT DEFAULT '[]',
    eta TEXT DEFAULT '—',
    created_at TEXT NOT NULL,
    deployed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS missions (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    agents TEXT DEFAULT '[]',
    progress INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    due TEXT DEFAULT '—',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS task_history (
    day TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    time TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    agent TEXT DEFAULT 'SYSTEM',
    icon TEXT DEFAULT '•',
    msg TEXT NOT NULL,
    kind TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`)

// ── Helpers ───────────────────────────────────────────────────────────────────
const nowTs = () => new Date().toISOString()
const genId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

// ── Seed data if empty ───────────────────────────────────────────────────────
const seedIfEmpty = () => {
  const agentCount = db.prepare('SELECT COUNT(*) as cnt FROM agents').get()
  if (agentCount.cnt === 0) {
    const agents = [
      { id:'agt-001', name:'ARIA', role:'Research Analyst', specialty:'Market Intelligence', avatar:'🔬', color:'#00F5FF', status:'active', tasks:7, completed:142, uptime:'99.8%', model:'GPT-4o', lastAction:'2 min ago', tags:JSON.stringify(['research','data','reports']) },
      { id:'agt-002', name:'ORION', role:'Growth Strategist', specialty:'Campaign Optimization', avatar:'📈', color:'#7B2FFF', status:'active', tasks:5, completed:98, uptime:'98.2%', model:'Claude 3.5', lastAction:'5 min ago', tags:JSON.stringify(['growth','marketing','ads']) },
      { id:'agt-003', name:'CIPHER', role:'Code Architect', specialty:'Full-Stack Development', avatar:'⚡', color:'#FFB800', status:'active', tasks:9, completed:211, uptime:'99.9%', model:'Claude 3.5', lastAction:'1 min ago', tags:JSON.stringify(['code','devops','automation']) },
      { id:'agt-004', name:'ECHO', role:'Content Synthesizer', specialty:'Copywriting & SEO', avatar:'✍️', color:'#FF3E6C', status:'idle', tasks:3, completed:87, uptime:'97.1%', model:'GPT-4o', lastAction:'18 min ago', tags:JSON.stringify(['content','seo','social']) },
      { id:'agt-005', name:'NOVA', role:'Operations Manager', specialty:'Workflow Automation', avatar:'🤖', color:'#00E676', status:'active', tasks:12, completed:304, uptime:'99.5%', model:'Gemini 1.5', lastAction:'Just now', tags:JSON.stringify(['ops','automation','pipeline']) },
      { id:'agt-006', name:'VEGA', role:'Finance Analyst', specialty:'Forecasting & Risk', avatar:'💎', color:'#7B2FFF', status:'standby', tasks:2, completed:56, uptime:'96.4%', model:'GPT-4o', lastAction:'1 hr ago', tags:JSON.stringify(['finance','risk','forecast']) },
    ]
    const insertAgent = db.prepare('INSERT INTO agents VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    for (const a of agents) {
      insertAgent.run(a.id, a.name, a.role, a.specialty, a.avatar, a.color, a.status, a.tasks, a.completed, a.uptime, a.model, a.lastAction, a.tags, nowTs())
    }
  }

  const taskCount = db.prepare('SELECT COUNT(*) as cnt FROM tasks').get()
  if (taskCount.cnt === 0) {
    const tasks = [
      { id:'t-001', col:'backlog', title:'Competitor Analysis Q3', desc:'Full competitive landscape review', agent:'agt-001', priority:'high', tags:JSON.stringify(['research','q3']), eta:'8h' },
      { id:'t-002', col:'backlog', title:'SEO Audit Report', desc:'Technical + content audit', agent:'agt-004', priority:'medium', tags:JSON.stringify(['seo','audit']), eta:'6h' },
      { id:'t-003', col:'briefed', title:'Campaign A/B Framework', desc:'Design test structure for Q3 push', agent:'agt-002', priority:'high', tags:JSON.stringify(['marketing','ab-test']), eta:'12h' },
      { id:'t-004', col:'briefed', title:'API Rate Limiter', desc:'Implement token bucket algorithm', agent:'agt-003', priority:'critical', tags:JSON.stringify(['api','security']), eta:'4h' },
      { id:'t-005', col:'active', title:'Landing Page Redesign', desc:'New hero + CTA optimization', agent:'agt-003', priority:'high', tags:JSON.stringify(['frontend','design']), eta:'16h' },
      { id:'t-006', col:'active', title:'Weekly Growth Report', desc:'Metrics dashboard update', agent:'agt-001', priority:'medium', tags:JSON.stringify(['reports','growth']), eta:'3h' },
      { id:'t-007', col:'active', title:'Social Media Calendar', desc:'Q3 content schedule', agent:'agt-004', priority:'low', tags:JSON.stringify(['social','content']), eta:'5h' },
      { id:'t-008', col:'review', title:'CI/CD Pipeline Optimization', desc:'Reduce build times', agent:'agt-005', priority:'medium', tags:JSON.stringify(['devops','ci-cd']), eta:'8h' },
      { id:'t-009', col:'review', title:'Ad Creative Batch', desc:'20 variants for FB/IG', agent:'agt-002', priority:'medium', tags:JSON.stringify(['ads','creative']), eta:'10h' },
      { id:'t-010', col:'deployed', title:'Data Pipeline v2', desc:'ETL refactor', agent:'agt-005', priority:'high', tags:JSON.stringify(['data','pipeline']), eta:'24h' },
      { id:'t-011', col:'deployed', title:'Dashboard UI Kit', desc:'Component library', agent:'agt-003', priority:'high', tags:JSON.stringify(['ui','components']), eta:'20h' },
      { id:'t-012', col:'deployed', title:'Risk Assessment Model', desc:'Monte Carlo simulation', agent:'agt-006', priority:'critical', tags:JSON.stringify(['finance','risk']), eta:'30h' },
    ]
    const insertTask = db.prepare('INSERT INTO tasks VALUES (?,?,?,?,?,?,?,?,?,?)')
    for (const t of tasks) {
      insertTask.run(t.id, t.col, t.title, t.desc, t.agent, t.priority, t.tags, t.eta, nowTs(), t.col === 'deployed' ? nowTs() : null)
    }
  }

  const missionCount = db.prepare('SELECT COUNT(*) as cnt FROM missions').get()
  if (missionCount.cnt === 0) {
    const missions = [
      { id:'m1', label:'Q3 Product Launch', agents:JSON.stringify(['agt-001','agt-002','agt-003']), progress:72, status:'active', due:'Jun 28' },
      { id:'m2', label:'SEO Domination Sprint', agents:JSON.stringify(['agt-004','agt-002']), progress:91, status:'active', due:'Jun 15' },
      { id:'m3', label:'Investor Deck Prep', agents:JSON.stringify(['agt-001','agt-006']), progress:44, status:'active', due:'Jul 5' },
      { id:'m4', label:'Infra Automation V2', agents:JSON.stringify(['agt-003','agt-005']), progress:58, status:'active', due:'Jun 22' },
    ]
    const insertMission = db.prepare('INSERT INTO missions VALUES (?,?,?,?,?,?,?)')
    for (const m of missions) {
      insertMission.run(m.id, m.label, m.agents, m.progress, m.status, m.due, nowTs())
    }
  }
}
seedIfEmpty()

// ── JSON parsers for SQLite-stored JSON fields ───────────────────────────────
const parseAgent = (row) => ({
  ...row,
  tags: JSON.parse(row.tags || '[]'),
  completed: row.completed || 0,
  tasks: row.tasks || 0,
})

const parseTask = (row) => ({
  ...row,
  tags: JSON.parse(row.tags || '[]'),
})

const parseMission = (row) => ({
  ...row,
  agents: JSON.parse(row.agents || '[]'),
})

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors())
app.use(express.json())

// ── Serve static files in production ──────────────────────────────────────────
const staticPath = join(__dirname, '..', 'dist')
app.use(express.static(staticPath))

// ── API Routes ────────────────────────────────────────────────────────────────

// GET /api/state — full state snapshot
app.get('/api/state', (_req, res) => {
  const agents = db.prepare('SELECT * FROM agents ORDER BY name').all().map(parseAgent)
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all().map(parseTask)
  const missions = db.prepare('SELECT * FROM missions ORDER BY created_at DESC').all().map(parseMission)
  const taskHistory = db.prepare('SELECT * FROM task_history').all()
  const events = db.prepare('SELECT * FROM events ORDER BY created_at DESC LIMIT 200').all()
  const history = {}
  taskHistory.forEach(h => { history[h.day] = h.count })
  res.json({ agents, tasks, missions, taskHistory: history, events })
})

// ── TASKS ─────────────────────────────────────────────────────────────────────

app.get('/api/tasks', (_req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all().map(parseTask)
  res.json(tasks)
})

app.post('/api/tasks', (req, res) => {
  const { title, desc, col, agent, priority, tags, eta } = req.body
  const id = genId('t')
  const ts = nowTs()
  db.prepare(`INSERT INTO tasks VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
    id, col || 'backlog', title, desc || '', agent || null,
    priority || 'medium', JSON.stringify(tags || []), eta || '—', ts, null
  )
  const task = parseTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id))
  emitEvent('task_created', `New task "${title}" created [${(col || 'backlog').toUpperCase()}]`, agent)
  res.status(201).json(task)
})

app.patch('/api/tasks/:id', (req, res) => {
  const { id } = req.params
  const old = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
  if (!old) return res.status(404).json({ error: 'Task not found' })
  const patch = req.body
  const updated = { ...old, ...patch }
  db.prepare(`UPDATE tasks SET col=?, title=?, desc=?, agent=?, priority=?, tags=?, eta=?, deployed_at=? WHERE id=?`).run(
    updated.col, updated.title, updated.desc, updated.agent,
    updated.priority, JSON.stringify(updated.tags || []), updated.eta,
    updated.deployed_at || null, id
  )
  if (patch.col && patch.col !== old.col) {
    if (patch.col === 'deployed') {
      db.prepare(`UPDATE agents SET completed = completed + 1 WHERE id = ?`).run(old.agent)
      const day = nowTs().slice(0, 10)
      db.prepare(`INSERT INTO task_history (day, count) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET count = count + 1`).run(day)
      emitEvent('task_moved', `Task "${old.title}" DEPLOYED ✓`, old.agent)
    } else if (old.col === 'deployed') {
      db.prepare(`UPDATE agents SET completed = MAX(0, completed - 1) WHERE id = ?`).run(old.agent)
      const day = old.deployed_at ? old.deployed_at.slice(0, 10) : null
      if (day) db.prepare(`UPDATE task_history SET count = MAX(0, count - 1) WHERE day = ?`).run(day)
      emitEvent('task_moved', `Task "${old.title}" moved from DEPLOYED → ${patch.col.toUpperCase()}`, old.agent)
    } else {
      emitEvent('task_moved', `Task "${old.title}" moved: ${old.col.toUpperCase()} → ${patch.col.toUpperCase()}`, old.agent)
    }
  } else {
    emitEvent('task_edited', `Task "${old.title}" updated`, old.agent)
  }
  const task = parseTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id))
  res.json(task)
})

app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
  if (!task) return res.status(404).json({ error: 'Task not found' })
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
  emitEvent('task_deleted', `Task "${task.title}" deleted from ${task.col.toUpperCase()}`, task.agent)
  res.json({ success: true })
})

// ── AGENTS ────────────────────────────────────────────────────────────────────

app.get('/api/agents', (_req, res) => {
  const agents = db.prepare('SELECT * FROM agents ORDER BY name').all().map(parseAgent)
  res.json(agents)
})

app.post('/api/agents', (req, res) => {
  const { name, role, specialty, avatar, color, model, tags } = req.body
  const id = genId('agt')
  const ts = nowTs()
  db.prepare(`INSERT INTO agents VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    id, name.toUpperCase(), role, specialty || '', avatar || '🤖',
    color || '#00F5FF', 'standby', 0, 0, '100%', model || 'GPT-4o',
    'just deployed', JSON.stringify(tags || []), ts
  )
  const agent = parseAgent(db.prepare('SELECT * FROM agents WHERE id = ?').get(id))
  emitEvent('agent_created', `Agent "${name.toUpperCase()}" deployed — ${role}`, id)
  res.status(201).json(agent)
})

app.patch('/api/agents/:id', (req, res) => {
  const { id } = req.params
  const old = db.prepare('SELECT * FROM agents WHERE id = ?').get(id)
  if (!old) return res.status(404).json({ error: 'Agent not found' })
  const patch = req.body
  const updated = { ...old, ...patch }
  db.prepare(`UPDATE agents SET name=?, role=?, specialty=?, avatar=?, color=?, status=?, model=?, tags=?, last_action=? WHERE id=?`).run(
    updated.name, updated.role, updated.specialty, updated.avatar, updated.color,
    updated.status, updated.model, JSON.stringify(updated.tags || []), updated.last_action || updated.lastAction, id
  )
  emitEvent('agent_edited', `Agent "${old.name}" updated`, id)
  const agent = parseAgent(db.prepare('SELECT * FROM agents WHERE id = ?').get(id))
  res.json(agent)
})

app.delete('/api/agents/:id', (req, res) => {
  const { id } = req.params
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id)
  if (!agent) return res.status(404).json({ error: 'Agent not found' })
  db.prepare('DELETE FROM agents WHERE id = ?').run(id)
  emitEvent('agent_deleted', `Agent "${agent.name}" decommissioned`, id)
  res.json({ success: true })
})

// ── MISSIONS ──────────────────────────────────────────────────────────────────

app.get('/api/missions', (_req, res) => {
  const missions = db.prepare('SELECT * FROM missions ORDER BY created_at DESC').all().map(parseMission)
  res.json(missions)
})

app.post('/api/missions', (req, res) => {
  const { label, agents: agentIds, progress, status, due } = req.body
  const id = genId('m')
  const ts = nowTs()
  db.prepare(`INSERT INTO missions VALUES (?,?,?,?,?,?,?)`).run(
    id, label, JSON.stringify(agentIds || []), progress || 0, status || 'active', due || '—', ts
  )
  const mission = parseMission(db.prepare('SELECT * FROM missions WHERE id = ?').get(id))
  emitEvent('mission_created', `Mission "${label}" launched — Due: ${due || '—'}`, null)
  res.status(201).json(mission)
})

app.patch('/api/missions/:id', (req, res) => {
  const { id } = req.params
  const old = db.prepare('SELECT * FROM missions WHERE id = ?').get(id)
  if (!old) return res.status(404).json({ error: 'Mission not found' })
  const patch = req.body
  const updated = { ...old, ...patch }
  db.prepare(`UPDATE missions SET label=?, agents=?, progress=?, status=?, due=? WHERE id=?`).run(
    updated.label, JSON.stringify(updated.agents || []), updated.progress, updated.status, updated.due, id
  )
  emitEvent('mission_edited', `Mission "${old.label}" updated`, null)
  const mission = parseMission(db.prepare('SELECT * FROM missions WHERE id = ?').get(id))
  res.json(mission)
})

app.delete('/api/missions/:id', (req, res) => {
  const { id } = req.params
  const mission = db.prepare('SELECT * FROM missions WHERE id = ?').get(id)
  if (!mission) return res.status(404).json({ error: 'Mission not found' })
  db.prepare('DELETE FROM missions WHERE id = ?').run(id)
  emitEvent('mission_deleted', `Mission "${mission.label}" aborted`, null)
  res.json({ success: true })
})

// ── EVENTS ────────────────────────────────────────────────────────────────────

app.get('/api/events', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 200, 500)
  const events = db.prepare('SELECT * FROM events ORDER BY created_at DESC LIMIT ?').all(limit)
  res.json(events)
})

app.delete('/api/events', (_req, res) => {
  db.prepare('DELETE FROM events').run()
  res.json({ success: true })
})

// ── RESET ─────────────────────────────────────────────────────────────────────

app.post('/api/reset', (_req, res) => {
  db.prepare('DELETE FROM events').run()
  db.prepare('DELETE FROM task_history').run()
  db.prepare('DELETE FROM missions').run()
  db.prepare('DELETE FROM tasks').run()
  db.prepare('DELETE FROM agents').run()
  seedIfEmpty()
  emitEvent('data_reset', 'All data reset to factory defaults', null)
  res.json({ success: true })
})

// ── Agent heartbeat simulation ───────────────────────────────────────────────
// Periodically generate simulated agent activity events
const SIM_TYPES = [
  { type: 'info', icon: '📋', msgs: [
    'Web crawl complete — {n} URLs indexed',
    'Report section {n} drafted — {w} words',
    'Citation check passed — {n} sources confirmed',
  ]},
  { type: 'success', icon: '✅', msgs: [
    'ROAS improved +{n}% on campaign',
    'A/B test variant B winning at {n}% confidence',
    'Retargeting audience updated — {n}K users',
  ]},
  { type: 'code', icon: '⚡', msgs: [
    'Function refactored — complexity reduced {n}%',
    'Tests passing: {n}/{n} assertions green',
    'Docker image built — {n}MB optimized',
  ]},
  { type: 'info', icon: '📝', msgs: [
    'Content batch scheduled — {n} posts queued',
    'SEO title variants created — top score {n}/100',
    'Blog outline generated — {n} sections',
  ]},
  { type: 'success', icon: '🚀', msgs: [
    'Workflow executed — {n} steps completed',
    'Data sync complete — {n} records updated',
    'Automation triggered — {n} actions fired',
  ]},
  { type: 'warning', icon: '⚠️', msgs: [
    'Latency spike detected — {n}ms — auto-retry engaged',
    'Rate limit warning on API — {n} req/s',
    'Memory usage at {n}% — optimizing',
  ]},
]

function emitEvent(kind, msg, agentId) {
  const eventTypes = {
    task_created: { type: 'info', icon: '📋' },
    task_moved: { type: 'success', icon: '🚚' },
    task_deleted: { type: 'warning', icon: '🗑' },
    task_edited: { type: 'info', icon: '✏️' },
    agent_created: { type: 'success', icon: '🤖' },
    agent_deleted: { type: 'warning', icon: '💥' },
    agent_edited: { type: 'info', icon: '⚙️' },
    mission_created: { type: 'success', icon: '🚀' },
    mission_deleted: { type: 'warning', icon: '✕' },
    mission_edited: { type: 'info', icon: '📝' },
    data_reset: { type: 'warning', icon: '↺' },
    data_exported: { type: 'info', icon: '⬇' },
  }
  const meta = eventTypes[kind] || { type: 'info', icon: '•' }
  let agentName = 'SYSTEM'
  if (agentId) {
    const ag = db.prepare('SELECT name FROM agents WHERE id = ?').get(agentId)
    if (ag) agentName = ag.name
  }
  const now = new Date()
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map(n => String(n).padStart(2, '0')).join(':')
  const id = genId('ev')
  db.prepare(`INSERT INTO events VALUES (?,?,?,?,?,?,?,?)`).run(
    id, time, meta.type, agentName, meta.icon, msg, kind, nowTs()
  )
}

// Simulated agent activity — runs every 3-8 seconds
function startAgentSimulation() {
  setInterval(() => {
    try {
      const agents = db.prepare('SELECT * FROM agents WHERE status != ?').all('standby')
      if (agents.length === 0) return
      const agent = agents[Math.floor(Math.random() * agents.length)]
      const tpl = SIM_TYPES[Math.floor(Math.random() * SIM_TYPES.length)]
      const msgTpl = tpl.msgs[Math.floor(Math.random() * tpl.msgs.length)]
      const msg = msgTpl
        .replace(/{n}/g, () => String(Math.floor(Math.random() * 900 + 10)))
        .replace(/{w}/g, () => String(Math.floor(Math.random() * 2000 + 200)))
      const now = new Date()
      const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
        .map(n => String(n).padStart(2, '0')).join(':')
      const id = genId('ev')
      db.prepare(`INSERT INTO events VALUES (?,?,?,?,?,?,?,?)`).run(
        id, time, tpl.type, agent.name, tpl.icon, msg, 'agent_activity', nowTs()
      )
      // Keep events table from growing too large
      db.prepare(`DELETE FROM events WHERE id NOT IN (SELECT id FROM events ORDER BY created_at DESC LIMIT 500)`).run()
    } catch (_) {}
  }, 3000 + Math.random() * 5000)
}

// ── SPA fallback ─────────────────────────────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(join(staticPath, 'index.html'))
})

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 NEXUS OS API running on http://localhost:${PORT}`)
  startAgentSimulation()
})
