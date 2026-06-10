import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './components/Dashboard'
import KanbanBoard from './components/KanbanBoard'
import AgentRoster from './components/AgentRoster'
import MissionControl from './components/MissionControl'
import Terminal from './components/Terminal'
import './App.css'

const VIEWS = {
  dashboard: Dashboard,
  kanban: KanbanBoard,
  agents: AgentRoster,
  missions: MissionControl,
  terminal: Terminal,
}

export default function App() {
  const [activeView, setActiveView] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [bootDone, setBootDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setBootDone(true), 1800)
    return () => clearTimeout(t)
  }, [])

  const ViewComponent = VIEWS[activeView] || Dashboard

  return (
    <div className="app-shell">
      {!bootDone && <BootScreen />}
      <Sidebar
        active={activeView}
        onNavigate={setActiveView}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(p => !p)}
      />
      <div className={`main-area ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <TopBar activeView={activeView} />
        <main className="content-area">
          <ViewComponent />
        </main>
      </div>
      <ScanLine />
    </div>
  )
}

function BootScreen() {
  return (
    <div className="boot-screen">
      <div className="boot-logo">
        <div className="boot-ring ring-1" />
        <div className="boot-ring ring-2" />
        <div className="boot-ring ring-3" />
        <span className="boot-text">NEXUS</span>
        <span className="boot-sub">INITIALIZING AGENT FLEET...</span>
      </div>
      <div className="boot-bars">
        {['NEURAL MESH','AGENT CORES','DATA STREAMS','MISSION SYNC','COMMS LAYER'].map((l,i)=>(
          <div className="boot-bar" key={l} style={{animationDelay:`${i*0.2}s`}}>
            <span>{l}</span>
            <div className="boot-bar-fill" style={{'--d':`${i*0.2+0.1}s`}} />
          </div>
        ))}
      </div>
    </div>
  )
}

function ScanLine() {
  return <div className="scan-line" />
}
