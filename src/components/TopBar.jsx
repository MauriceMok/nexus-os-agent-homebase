import { useState, useEffect } from 'react'
import { useAppStore } from '../store/StoreContext'

const VIEW_META = {
  dashboard: { icon: '⬡', title: 'HOMEBASE', sub: 'AI Agent Operating System' },
  kanban: { icon: '▦', title: 'COMMAND BOARD', sub: 'Task & Mission Operations' },
  agents: { icon: '◈', title: 'AGENT FLEET', sub: 'Active AI Roster' },
  missions: { icon: '◎', title: 'MISSION CONTROL', sub: 'Analytics & Intelligence' },
  terminal: { icon: '▶', title: 'COMMS TERMINAL', sub: 'Live Agent Feed' },
}

const TICKER_BASE = [
  { label: 'NOVA: CI/CD deployed', type: 'ok' },
  { label: 'ARIA: 847 data pts scraped', type: 'ok' },
  { label: 'CIPHER: Rate limiter shipped', type: 'ok' },
  { label: 'ORION: CTR +2.3% ↑', type: 'ok' },
  { label: 'NOVA: Webhook latency spike', type: 'warn' },
  { label: 'VEGA: Q4 forecast complete', type: 'ok' },
  { label: 'ECHO: 7 emails drafted', type: 'ok' },
  { label: 'CIPHER: Test coverage 98.4%', type: 'ok' },
]

export default function TopBar({ activeView }) {
  const { agents, tasks } = useAppStore()
  const [time, setTime] = useState(new Date())
  const meta = VIEW_META[activeView] || VIEW_META.dashboard

  const activeAgents = agents.filter(a => a.status === 'active').length
  const activeTasks = tasks.filter(t => t.col === 'active').length

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const pad = n => String(n).padStart(2, '0')
  const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`

  const doubled = [...TICKER_BASE, ...TICKER_BASE]

  return (
    <header className="topbar">
      <div className="topbar-breadcrumb">
        <span className="topbar-crumb-icon">{meta.icon}</span>
        <div>
          <div className="topbar-crumb-title">{meta.title}</div>
          <div className="topbar-crumb-sub">{meta.sub}</div>
        </div>
      </div>

      <div className="topbar-sep">·</div>

      <div className="topbar-ticker">
        <div className="ticker-track">
          {doubled.map((item, i) => (
            <div className="ticker-item" key={i}>
              <div className={`ticker-dot${item.type === 'warn' ? ' warn' : ''}`} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="topbar-actions">
        <div className="topbar-stat">
          <span>ACTIVE</span>
          <strong>{activeAgents}</strong>
          <span>agents</span>
        </div>
        <div className="topbar-stat">
          <span>TASKS</span>
          <strong>{activeTasks}</strong>
          <span>live</span>
        </div>
        <div className="topbar-clock">{timeStr}</div>
        <div className="topbar-avatar" title="Commander">👤</div>
      </div>
    </header>
  )
}
