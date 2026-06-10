import { useAppStore } from '../store/StoreContext'

const NAV_ITEMS = [
  { id: 'dashboard', icon: '⬡', label: 'HOMEBASE', sub: 'Mission Overview' },
  { id: 'kanban', icon: '▦', label: 'COMMAND BOARD', sub: 'Task Operations' },
  { id: 'agents', icon: '◈', label: 'AGENT FLEET', sub: 'AI Roster' },
  { id: 'missions', icon: '◎', label: 'MISSION CTRL', sub: 'Analytics & KPIs' },
  { id: 'terminal', icon: '▶', label: 'COMMS TERMINAL', sub: 'Live Feed' },
]

export default function Sidebar({ active, onNavigate, collapsed, onToggle }) {
  const { tasks, agents } = useAppStore()

  const liveTaskCount = tasks.filter(t => t.col === 'active' || t.col === 'briefed').length
  const agentCount = agents.length

  const BADGES = {
    kanban: liveTaskCount > 0 ? String(liveTaskCount) : null,
    agents: agentCount > 0 ? String(agentCount) : null,
  }

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">⬡</div>
        {!collapsed && (
          <div>
            <div className="logo-text">NEXUS</div>
            <div className="logo-version">OS v2.4.1</div>
          </div>
        )}
      </div>

      <div className="sidebar-scroll">
        <div className="sidebar-section-title">NAVIGATION</div>
        {NAV_ITEMS.map(item => (
          <div
            key={item.id}
            className={`nav-item${active === item.id ? ' active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <div className="nav-icon">{item.icon}</div>
            <div className="nav-label">
              <span className="nav-label-main">{item.label}</span>
              <span className="nav-label-sub">{item.sub}</span>
            </div>
            {BADGES[item.id] && <span className="nav-badge">{BADGES[item.id]}</span>}
          </div>
        ))}

        <div className="sidebar-section-title" style={{ marginTop: 16 }}>AGENT FLEET</div>
        <div className="sidebar-agents">
          {agents.map(agent => (
            <div
              key={agent.id}
              className="agent-mini"
              style={{ '--agent-color': agent.color }}
              onClick={() => onNavigate('agents')}
            >
              <div className="agent-mini-avatar" style={{ '--agent-color': agent.color }}>
                {agent.avatar}
              </div>
              <div className="agent-mini-info">
                <span className="agent-mini-name">{agent.name}</span>
                <span className="agent-mini-role">{agent.role}</span>
              </div>
              <div className={`agent-mini-status status-${agent.status}`} />
            </div>
          ))}
          {agents.length === 0 && !collapsed && (
            <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-muted)',padding:'8px',textAlign:'center'}}>
              No agents yet
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <button className="sidebar-toggle" onClick={onToggle}>
          {collapsed ? '▶' : '◀'}
        </button>
        <span className="sidebar-footer-text">NEXUS OS · {new Date().getFullYear()}</span>
      </div>
    </aside>
  )
}
