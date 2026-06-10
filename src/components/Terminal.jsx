import { useState, useEffect, useRef } from 'react'
import { INITIAL_FEED, LOG_TEMPLATES } from '../data/feed'

const COMMANDS = {
  help: () => [
    '  NEXUS OS Terminal — Available Commands:',
    '  status        — Show fleet status',
    '  agents        — List all agents',
    '  tasks         — Show active tasks',
    '  mission <id>  — Show mission details',
    '  clear         — Clear terminal',
    '  ping <agent>  — Ping an agent',
    '  deploy <name> — Deploy a new agent',
  ],
  status: () => [
    '  ◉ SYSTEM STATUS: NOMINAL',
    '  Active Agents: 5/6',
    '  Live Tasks: 12',
    '  Uptime: 47d 14h 22m',
    '  Neural Mesh: CONNECTED',
    '  Data Streams: 847/847 active',
    '  Last Sync: 0.3s ago',
  ],
  agents: () => [
    '  ID       NAME     STATUS    TASKS  MODEL',
    '  ─────────────────────────────────────────',
    '  agt-001  ARIA     ◉ ACTIVE    7    GPT-4o',
    '  agt-002  ORION    ◉ ACTIVE    5    Claude 3.5',
    '  agt-003  CIPHER   ◉ ACTIVE    9    Claude 3.5',
    '  agt-004  ECHO     ● IDLE      3    GPT-4o',
    '  agt-005  NOVA     ◉ ACTIVE   12    Gemini 1.5',
    '  agt-006  VEGA     ○ STANDBY   2    GPT-4o',
  ],
  tasks: () => [
    '  Active pipeline: 12 tasks in flight',
    '  • [ACTIVE] Onboarding Email Sequence → ECHO',
    '  • [ACTIVE] Dashboard Analytics → CIPHER',
    '  • [ACTIVE] Revenue Forecast Q4 → VEGA',
    '  • [ACTIVE] CI/CD Pipeline Refactor → NOVA',
    '  • [REVIEW] Investor One-Pager → ARIA',
    '  • [REVIEW] SEO Technical Audit → ECHO',
    '  Run "kanban" for full board view.',
  ],
  clear: () => null,
}

function resolveCommand(input) {
  const [cmd, ...args] = input.trim().toLowerCase().split(' ')
  if (cmd === 'ping' && args[0]) {
    return [`  Pinging ${args[0].toUpperCase()}...`, `  Response: 12ms — ${args[0].toUpperCase()} ONLINE ◉`]
  }
  if (cmd === 'deploy' && args[0]) {
    return [
      `  Initializing agent deployment: ${args.join(' ').toUpperCase()}`,
      '  ▶ Loading base model weights...',
      '  ▶ Configuring memory context...',
      '  ▶ Connecting to tool registry...',
      `  ✓ Agent ${args.join(' ').toUpperCase()} deployed successfully`,
    ]
  }
  if (cmd === 'mission') {
    return [
      `  Mission ID: ${args[0] || 'm1'}`,
      '  Status: ACTIVE | Progress: 72%',
      '  Agents: ARIA, ORION, CIPHER',
      '  Due: Jun 28 | Priority: HIGH',
    ]
  }
  if (COMMANDS[cmd]) return COMMANDS[cmd]()
  if (!cmd) return null
  return [`  Command not found: "${cmd}" — type "help" for list`]
}

export default function Terminal() {
  const [lines, setLines] = useState(() =>
    INITIAL_FEED.map(e => ({...e, isLog: true}))
  )
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [histIdx, setHistIdx] = useState(-1)
  const bodyRef = useRef(null)

  useEffect(() => {
    const t = setInterval(() => {
      const tpl = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)]
      const msgTpl = tpl.msgs[Math.floor(Math.random() * tpl.msgs.length)]
      const msg = msgTpl.replace(/{n}/g, () => Math.floor(Math.random() * 900 + 10))
        .replace(/{w}/g, () => Math.floor(Math.random() * 2000 + 200))
      const now = new Date()
      const ts = [now.getHours(), now.getMinutes(), now.getSeconds()]
        .map(n => String(n).padStart(2,'0')).join(':')
      setLines(prev => [...prev, { id: Date.now(), time: ts, agent: tpl.agent, type: tpl.type, msg, isLog: true }])
    }, 2500)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [lines])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const cmd = input.trim()
    const now = new Date()
    const ts = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map(n => String(n).padStart(2,'0')).join(':')

    setLines(prev => [...prev, {
      id: Date.now(), time: ts, agent: 'YOU', type: 'cmd', msg: cmd, isLog: false
    }])
    setHistory(prev => [cmd, ...prev])
    setHistIdx(-1)

    const result = resolveCommand(cmd)
    if (result === null) {
      setLines([])
    } else if (result) {
      result.forEach((line, i) => {
        setTimeout(() => {
          setLines(prev => [...prev, {
            id: Date.now() + i, time: ts, agent: 'SYS', type: 'sys', msg: line, isLog: false
          }])
        }, i * 60)
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
          <div className="page-subtitle">Live agent feed · Type "help" for commands</div>
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
            LIVE STREAM
          </div>
        </div>

        <div className="terminal-body" ref={bodyRef}>
          <div className="term-line term-type-info" style={{marginBottom:8}}>
            <span className="term-time">──────</span>
            <span className="term-agent" style={{color:'var(--cyan)'}}>NEXUS</span>
            <span className="term-msg">OS v2.4.1 initialized — Neural mesh active — 6 agents connected</span>
          </div>
          <div className="term-line term-type-info" style={{marginBottom:12}}>
            <span className="term-time">──────</span>
            <span className="term-agent" style={{color:'var(--cyan)'}}>NEXUS</span>
            <span className="term-msg">Type "help" to see available commands</span>
          </div>

          {lines.map(line => (
            <div key={line.id} className={`term-line term-type-${line.isLog ? line.type : line.type === 'cmd' ? 'cmd' : 'sys'}`}>
              <span className="term-time">{line.time}</span>
              <span className="term-agent" style={
                line.type === 'cmd' ? {color:'var(--gold)'} :
                line.type === 'sys' ? {color:'var(--text-muted)'} : undefined
              }>
                {line.type === 'cmd' ? '» YOU' : `[${line.agent}]`}
              </span>
              <span className="term-msg" style={
                line.type === 'cmd' ? {color:'var(--text-primary)',fontWeight:600} :
                line.type === 'sys' ? {color:'var(--text-secondary)'} : undefined
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
            placeholder="enter command or query..."
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </form>
      </div>
    </div>
  )
}
