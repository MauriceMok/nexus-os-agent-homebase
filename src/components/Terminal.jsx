import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../store/StoreContext'

// Log templates that use real agent names (injected at runtime)
const LOG_MSG_TEMPLATES = [
  { type: 'info',    msgs: ['Web crawl complete — {n} URLs indexed', 'Report section {n} drafted — {w} words', 'Citation check passed — {n} sources confirmed'] },
  { type: 'success', msgs: ['ROAS improved +{n}% on campaign', 'A/B test variant B winning at {n}% confidence', 'Retargeting audience updated — {n}K users'] },
  { type: 'code',    msgs: ['Function refactored — complexity reduced {n}%', 'Tests passing: {n}/{n} assertions green', 'Docker image built — {n}MB optimized'] },
  { type: 'info',    msgs: ['Content batch scheduled — {n} posts queued', 'SEO title variants created — top score {n}/100', 'Blog outline generated — {n} sections'] },
  { type: 'success', msgs: ['Workflow executed — {n} steps completed', 'Data sync complete — {n} records updated', 'Automation triggered — {n} actions fired'] },
  { type: 'warning', msgs: ['Latency spike detected — {n}ms — auto-retry engaged', 'Rate limit warning on API — {n} req/s', 'Memory usage at {n}% — optimizing'] },
]

const fmtNum = () => Math.floor(Math.random() * 900 + 10)
const fmtWord = () => Math.floor(Math.random() * 2000 + 200)
const ts = () => {
  const now = new Date()
  return [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2,'0')).join(':')
}

export default function Terminal() {
  const { tasks, agents, missions, taskHistory } = useAppStore()
  const [lines, setLines] = useState([])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [histIdx, setHistIdx] = useState(-1)
  const bodyRef = useRef(null)
  const agentsRef = useRef(agents)

  // Keep ref in sync so interval always has fresh agent list
  useEffect(() => { agentsRef.current = agents }, [agents])

  // Boot lines on mount
  useEffect(() => {
    const bootLines = [
      { id: 'b1', time: '──────', agent: 'NEXUS', type: 'info', msg: `OS v2.4.1 initialized — Neural mesh active — ${agents.length} agents connected` },
      { id: 'b2', time: '──────', agent: 'NEXUS', type: 'info', msg: 'Type "help" to see all commands' },
    ]
    setLines(bootLines)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-feed: pick random real agent + random message template
  useEffect(() => {
    const t = setInterval(() => {
      const currentAgents = agentsRef.current
      if (!currentAgents.length) return
      const agent = currentAgents[Math.floor(Math.random() * currentAgents.length)]
      const tpl = LOG_MSG_TEMPLATES[Math.floor(Math.random() * LOG_MSG_TEMPLATES.length)]
      const msgTpl = tpl.msgs[Math.floor(Math.random() * tpl.msgs.length)]
      const msg = msgTpl.replace(/{n}/g, fmtNum).replace(/{w}/g, fmtWord)
      setLines(prev => [...prev, {
        id: Date.now(), time: ts(), agent: agent.name, type: tpl.type, msg, isLog: true,
      }])
    }, 2500)
    return () => clearInterval(t)
  }, [])

  // Auto-scroll
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [lines])

  // ── Command resolver — ALL LIVE DATA ─────────────────────────────────────────
  const resolveCommand = useCallback((rawInput) => {
    const [cmd, ...args] = rawInput.trim().toLowerCase().split(' ')
    const now = ts()

    switch (cmd) {
      case 'help':
        return [
          '  NEXUS OS Terminal — Available Commands:',
          '  ─────────────────────────────────────────────────',
          '  status              — Live fleet & system status',
          '  agents              — List all deployed agents',
          '  tasks               — Show full task pipeline',
          '  tasks active        — Show only active tasks',
          '  tasks <col>         — Filter: backlog|briefed|active|review|deployed',
          '  missions            — List all active missions',
          '  agent <name>        — Inspect a specific agent',
          '  ping <agent>        — Ping an agent',
          '  deploy <name>       — Deploy simulation',
          '  history             — Show 7-day deployment stats',
          '  clear               — Clear terminal output',
        ]

      case 'status': {
        const activeAgents = agents.filter(a => a.status === 'active').length
        const idleAgents = agents.filter(a => a.status === 'idle').length
        const activeTasks = tasks.filter(t => t.col === 'active').length
        const deployedTasks = tasks.filter(t => t.col === 'deployed').length
        const rate = tasks.length > 0 ? Math.round((deployedTasks / tasks.length) * 100) : 0
        return [
          '  ◉ SYSTEM STATUS: NOMINAL',
          `  Active Agents:    ${activeAgents} / ${agents.length} (${idleAgents} idle, ${agents.filter(a=>a.status==='standby').length} standby)`,
          `  Live Tasks:       ${activeTasks} active · ${tasks.filter(t=>t.col==='review').length} in review`,
          `  Total Tasks:      ${tasks.length} · ${deployedTasks} deployed (${rate}% completion)`,
          `  Active Missions:  ${missions.length}`,
          '  Neural Mesh:      CONNECTED',
          `  Last Updated:     ${now}`,
        ]
      }

      case 'agents': {
        if (!agents.length) return ['  No agents deployed yet. Use "+ DEPLOY AGENT" in the Fleet panel.']
        const header = '  NAME          STATUS     MODEL            TASKS  COMPLETED'
        const sep    = '  ─────────────────────────────────────────────────────────'
        const rows = agents.map(a => {
          const activeTasks = tasks.filter(t => t.agent === a.id && t.col !== 'deployed').length
          const statusIcon = a.status === 'active' ? '◉' : a.status === 'idle' ? '●' : '○'
          const name = a.name.padEnd(13)
          const status = `${statusIcon} ${a.status.toUpperCase()}`.padEnd(10)
          const model = a.model.padEnd(16)
          return `  ${name} ${status} ${model} ${String(activeTasks).padStart(5)}  ${String(a.completed).padStart(9)}`
        })
        return [header, sep, ...rows, sep, `  ${agents.length} agent(s) total`]
      }

      case 'agent': {
        const name = args.join(' ').toUpperCase()
        const agent = agents.find(a => a.name === name || a.name.startsWith(name))
        if (!agent) return [`  Agent "${name}" not found. Run "agents" for the full list.`]
        const agentTasks = tasks.filter(t => t.agent === agent.id && t.col !== 'deployed')
        const statusIcon = agent.status === 'active' ? '◉' : agent.status === 'idle' ? '●' : '○'
        return [
          `  ── AGENT: ${agent.name} ──`,
          `  Role:       ${agent.role}`,
          `  Specialty:  ${agent.specialty}`,
          `  Model:      ${agent.model}`,
          `  Status:     ${statusIcon} ${agent.status.toUpperCase()}`,
          `  Active Tasks:   ${agentTasks.length}`,
          `  All Completed:  ${agent.completed}`,
          `  Last Action:    ${agent.lastAction}`,
          `  Tags: ${agent.tags.map(t => '#' + t).join(', ') || 'none'}`,
          agentTasks.length ? `  Current tasks:` : `  No active tasks.`,
          ...agentTasks.map(t => `    • [${t.col.toUpperCase()}] ${t.title} — Priority: ${t.priority}`),
        ]
      }

      case 'tasks': {
        const colFilter = args[0] || null
        const validCols = ['backlog','briefed','active','review','deployed']
        const filtered = colFilter && validCols.includes(colFilter)
          ? tasks.filter(t => t.col === colFilter)
          : tasks
        if (!filtered.length) return [`  No tasks found${colFilter ? ` in "${colFilter}"` : ''}.`]
        const groups = {}
        filtered.forEach(t => { if (!groups[t.col]) groups[t.col] = []; groups[t.col].push(t) })
        const out = [`  Task Pipeline (${filtered.length} tasks):`]
        for (const col of validCols) {
          if (!groups[col]?.length) continue
          out.push(`  ── ${col.toUpperCase()} (${groups[col].length}) ──`)
          groups[col].forEach(t => {
            const agent = agents.find(a => a.id === t.agent)
            const agentName = agent ? agent.name : 'unassigned'
            out.push(`    • [${t.priority.toUpperCase()}] ${t.title} → ${agentName}`)
          })
        }
        return out
      }

      case 'missions': {
        if (!missions.length) return ['  No active missions. Create one in Mission Control.']
        return [
          `  Active Missions (${missions.length}):`,
          '  ─────────────────────────────────────────',
          ...missions.map(m => {
            const agentNames = (m.agents || []).map(aid => agents.find(a => a.id === aid)?.name || aid).join(', ')
            return `  [${m.progress}%] ${m.label}  ·  Due: ${m.due}  ·  Agents: ${agentNames || 'none'}`
          }),
        ]
      }

      case 'history': {
        const today = new Date()
        const last7 = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(today)
          d.setDate(d.getDate() - (6 - i))
          return d.toISOString().slice(0, 10)
        })
        const maxVal = Math.max(...last7.map(d => taskHistory[d] || 0), 1)
        return [
          '  7-Day Deployment History:',
          '  ─────────────────────────────────────────',
          ...last7.map(day => {
            const count = taskHistory[day] || 0
            const barLen = Math.round((count / maxVal) * 20)
            const bar = '█'.repeat(barLen) + '░'.repeat(20 - barLen)
            const label = day.slice(5) // MM-DD
            return `  ${label}  ${bar}  ${count}`
          }),
          '  ─────────────────────────────────────────',
          `  Total last 7 days: ${last7.reduce((s, d) => s + (taskHistory[d] || 0), 0)} deployed`,
        ]
      }

      case 'ping': {
        const name = args.join(' ').toUpperCase()
        const agent = agents.find(a => a.name === name || a.name.startsWith(name))
        if (!agent) return [`  No agent named "${name}". Run "agents" to see the fleet.`]
        const latency = Math.floor(Math.random() * 40 + 4)
        const statusIcon = agent.status === 'active' ? '◉' : agent.status === 'idle' ? '●' : '○'
        return [
          `  Pinging ${agent.name}...`,
          `  Response: ${latency}ms — ${agent.name} ${statusIcon} ${agent.status.toUpperCase()}`,
          `  Model: ${agent.model}  ·  Last action: ${agent.lastAction}`,
        ]
      }

      case 'deploy': {
        const name = args.join(' ').toUpperCase()
        if (!name) return ['  Usage: deploy <agent-name>']
        return [
          `  Initializing agent deployment: ${name}`,
          '  ▶ Loading base model weights...',
          '  ▶ Configuring memory context...',
          '  ▶ Connecting to tool registry...',
          `  ✓ ${name} deployed — go to Agent Fleet to configure`,
        ]
      }

      case 'clear':
        return null

      default:
        if (!cmd) return null
        return [`  Command not found: "${cmd}" — type "help" for available commands`]
    }
  }, [agents, tasks, missions, taskHistory])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const cmdStr = input.trim()
    const t = ts()

    setLines(prev => [...prev, { id: Date.now(), time: t, agent: 'YOU', type: 'cmd', msg: cmdStr }])
    setHistory(prev => [cmdStr, ...prev])
    setHistIdx(-1)

    const result = resolveCommand(cmdStr)
    if (result === null) {
      setLines([])
    } else if (result) {
      result.forEach((line, i) => {
        setTimeout(() => {
          setLines(prev => [...prev, { id: Date.now() + i + 1, time: t, agent: 'SYS', type: 'sys', msg: line }])
        }, i * 55)
      })
    }
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const idx = Math.min(histIdx + 1, history.length - 1)
      setHistIdx(idx)
      setInput(history[idx] || '')
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const idx = Math.max(histIdx - 1, -1)
      setHistIdx(idx)
      setInput(idx === -1 ? '' : history[idx])
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">COMMS TERMINAL</div>
          <div className="page-subtitle">
            Live agent feed · {agents.length} agents · {tasks.filter(t=>t.col==='active').length} active tasks · type "help" for commands
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => setLines([])}>✕ CLEAR</button>
        </div>
      </div>

      <div className="terminal-wrap">
        <div className="terminal-header">
          <div className="term-dot term-dot-r"/>
          <div className="term-dot term-dot-y"/>
          <div className="term-dot term-dot-g"/>
          <div className="term-title">nexus-os — comms-terminal — agent-stream</div>
          <div className="term-live">
            <div className="term-live-dot"/>
            LIVE
          </div>
        </div>

        <div className="terminal-body" ref={bodyRef}>
          {lines.map(line => (
            <div
              key={line.id}
              className={`term-line term-type-${line.type === 'cmd' ? 'cmd' : line.type === 'sys' ? 'sys' : line.type}`}
            >
              <span className="term-time">{line.time}</span>
              <span className="term-agent" style={
                line.type === 'cmd' ? { color: 'var(--gold)' } :
                line.agent === 'SYS' ? { color: 'var(--text-muted)' } :
                line.agent === 'NEXUS' ? { color: 'var(--cyan)' } : undefined
              }>
                {line.type === 'cmd' ? '» YOU' : `[${line.agent}]`}
              </span>
              <span className="term-msg" style={
                line.type === 'cmd' ? { color: 'var(--text-primary)', fontWeight: 600 } :
                line.type === 'sys' ? { color: 'var(--text-secondary)' } : undefined
              }>
                {line.msg}
              </span>
            </div>
          ))}
        </div>

        <form className="term-prompt" onSubmit={handleSubmit}>
          <span className="term-prompt-sign">nexus@os:~$</span>
          <input
            className="term-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='type a command... ("help" for list)'
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </form>
      </div>
    </div>
  )
}
