import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store/StoreContext'

const VIEW_META = {
  dashboard: { icon: '⬡', title: 'HOMEBASE', sub: 'AI Agent Operating System' },
  kanban: { icon: '▦', title: 'COMMAND BOARD', sub: 'Task & Mission Operations' },
  agents: { icon: '◈', title: 'AGENT FLEET', sub: 'Active AI Roster' },
  missions: { icon: '◎', title: 'MISSION CONTROL', sub: 'Analytics & Intelligence' },
  terminal: { icon: '▶', title: 'COMMS TERMINAL', sub: 'Live Agent Feed' },
}

export default function TopBar({ activeView }) {
  const { agents, tasks, events } = useAppStore()
  const [time, setTime] = useState(new Date())
  const meta = VIEW_META[activeView] || VIEW_META.dashboard
  const eventsRef = useRef(events)
  useEffect(() => { eventsRef.current = events }, [events])

  const activeAgents = agents.filter(a => a.status === 'active').length
  const activeTasks = tasks.filter(t => t.col === 'active').length

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const pad = n => String(n).padStart(2, '0')
  const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`

  // Build ticker from recent events + agent status summary
  const tickerItems = (() => {
    const currentEvents = eventsRef.current || []
    const items = []

    // Add recent events (last 6)
    for (const ev of currentEvents.slice(0, 6)) {
      const shortMsg = ev.msg.length > 45 ? ev.msg.slice(0, 42) + '...' : ev.msg
      items.push({
        label: `${ev.agent}: ${shortMsg}`,
        type: ev.type === 'warning' ? 'warn' : 'ok',
      })
    }

    // If not enough events, fill with agent status summaries
    if (items.length < 6 && agents.length > 0) {
      for (const agent of agents.slice(0, 6 - items.length)) {
        const agentTasks = tasks.filter(t => t.agent === agent.id && t.col !== 'deployed').length
        items.push({
          label: `${agent.name}: ${agent.status.toUpperCase()} · ${agentTasks} active tasks · ${agent.completed} completed`,
          type: agent.status === 'active' ? 'ok' : agent.status === 'idle' ? 'ok' : 'ok',
        })
      }
    }

    // Fallback
    if (items.length === 0) {
      items.push({ label: 'NEXUS OS — All systems nominal', type: 'ok' })
    }

    return items
  })()

  // Double for seamless loop
  const doubled = tickerItems.length > 0 ? [...tickerItems, ...tickerItems] : [{ label: 'NEXUS OS', type: 'ok' }, { label: 'NEXUS OS', type: 'ok' }]

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
