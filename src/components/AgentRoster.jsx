import { useState, useMemo } from 'react'
import { useAppStore } from '../store/StoreContext'
import { useToast } from './Toast'
import { CreateAgentModal, EditAgentModal } from './AgentModal'
import { ConfirmModal } from './Modal'

const STATUS_COLORS = { active: '#00E676', idle: '#FFB800', standby: '#4A5568' }
const STATUS_LABELS = { active: 'ACTIVE', idle: 'IDLE', standby: 'STANDBY' }

export default function AgentRoster() {
  const { agents, tasks, deleteAgent, updateAgent, exportData } = useAppStore()
  const toast = useToast()
  // Live active task counts per agent
  const liveTaskCounts = useMemo(() => {
    const map = {}
    agents.forEach(a => {
      map[a.id] = tasks.filter(t => t.agent === a.id && t.col !== 'deployed').length
    })
    return map
  }, [agents, tasks])
  const [showCreate, setShowCreate] = useState(false)
  const [editAgent, setEditAgent] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = agents.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.role.toLowerCase().includes(search.toLowerCase()) ||
    (a.specialty || '').toLowerCase().includes(search.toLowerCase())
  )

  const cycleStatus = (agent) => {
    const cycle = { active: 'idle', idle: 'standby', standby: 'active' }
    const next = cycle[agent.status]
    updateAgent(agent.id, { status: next })
    toast(`${agent.name} status → ${next.toUpperCase()}`, 'info')
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">AGENT FLEET</div>
          <div className="page-subtitle">{agents.length} agents deployed · {agents.filter(a=>a.status==='active').length} active</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={exportData}>⬇ EXPORT</button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ DEPLOY AGENT</button>
        </div>
      </div>

      {/* Fleet Summary Bar */}
      <div style={{
        display:'flex',gap:12,marginBottom:20,
        background:'var(--bg-panel)',border:'1px solid var(--border)',
        borderRadius:'var(--radius)',padding:'14px 20px',
        borderTop:'2px solid var(--cyan)',
      }}>
        {[
          {label:'TOTAL AGENTS',val:agents.length,color:'var(--cyan)'},
          {label:'ACTIVE',val:agents.filter(a=>a.status==='active').length,color:'var(--green)'},
          {label:'IDLE',val:agents.filter(a=>a.status==='idle').length,color:'var(--gold)'},
          {label:'STANDBY',val:agents.filter(a=>a.status==='standby').length,color:'var(--text-muted)'},
          {label:'TASKS IN FLIGHT',val:Object.values(liveTaskCounts).reduce((s,v)=>s+v,0),color:'var(--cyan)'},
          {label:'TOTAL DEPLOYED',val:agents.reduce((s,a)=>s+a.completed,0).toLocaleString(),color:'var(--violet)'},
        ].map((stat,i) => (
          <div key={i} style={{flex:1,textAlign:'center',borderRight:i<5?'1px solid var(--border)':'none',paddingRight:12}}>
            <div style={{fontFamily:'var(--font-brand)',fontSize:22,fontWeight:700,color:stat.color}}>{stat.val}</div>
            <div style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)',marginTop:3,letterSpacing:1}}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="filter-bar" style={{marginBottom:20}}>
        <input
          className="filter-search"
          style={{width:280}}
          placeholder="🔍  Search agents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <div style={{textAlign:'center',padding:'48px 24px',color:'var(--text-muted)',fontFamily:'var(--font-mono)',fontSize:13}}>
          {search ? `No agents matching "${search}"` : 'No agents deployed yet.'}
        </div>
      )}

      <div className="agent-grid">
        {filtered.map((agent, idx) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            liveTaskCount={liveTaskCounts[agent.id] ?? 0}
            delay={idx * 0.05}
            onEdit={() => setEditAgent(agent)}
            onDelete={() => setDeleteConfirm(agent)}
            onCycleStatus={() => cycleStatus(agent)}
          />
        ))}
      </div>

      {showCreate && <CreateAgentModal onClose={() => { setShowCreate(false); toast('Agent deployed!', 'success') }} />}
      {editAgent && <EditAgentModal agent={editAgent} onClose={() => { setEditAgent(null); toast('Agent updated', 'success') }} />}
      {deleteConfirm && (
        <ConfirmModal
          title="DECOMMISSION AGENT"
          message={`Permanently remove ${deleteConfirm.name} from the fleet? All associated data will be lost.`}
          danger
          onConfirm={() => { deleteAgent(deleteConfirm.id); toast(`${deleteConfirm.name} decommissioned`, 'info') }}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}

function AgentCard({ agent, liveTaskCount, delay, onEdit, onDelete, onCycleStatus }) {
  const statusColor = STATUS_COLORS[agent.status] || '#4A5568'
  const statusLabel = STATUS_LABELS[agent.status] || 'UNKNOWN'

  return (
    <div
      className="agent-card"
      style={{
        '--agent-color': agent.color,
        opacity: 0,
        animation: `float-up 0.4s ease ${delay}s forwards`,
      }}
    >
      <div className="agent-card-glow" />

      <div className="agent-card-header">
        <div className="agent-avatar-wrap">
          <div className="agent-avatar">{agent.avatar}</div>
          <div className="agent-avatar-ring" style={{ borderColor: agent.color }} />
          <div
            className="agent-status-dot"
            style={{ background: statusColor }}
            title={`Click to cycle status (${statusLabel})`}
            onClick={onCycleStatus}
            role="button"
          />
        </div>

        <div className="agent-info">
          <div className="agent-name">{agent.name}</div>
          <div className="agent-role">{agent.role}</div>
          <div className="agent-specialty">{agent.specialty}</div>
        </div>

        <div style={{ display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end' }}>
          <div className="agent-model-badge">{agent.model}</div>
          <div style={{
            fontFamily:'var(--font-mono)',fontSize:9,
            padding:'2px 6px',borderRadius:4,
            background:`${statusColor}22`,color:statusColor,
            border:`1px solid ${statusColor}44`,letterSpacing:1,
            cursor:'pointer',
          }} onClick={onCycleStatus}>
            ◉ {statusLabel}
          </div>
        </div>
      </div>

      <div className="agent-stats">
        <div className="agent-stat">
          <div className="agent-stat-val" style={{ color: liveTaskCount > 0 ? agent.color : undefined }}>{liveTaskCount}</div>
          <div className="agent-stat-lbl">Active Tasks</div>
        </div>
        <div className="agent-stat">
          <div className="agent-stat-val">{agent.completed}</div>
          <div className="agent-stat-lbl">Deployed</div>
        </div>
        <div className="agent-stat">
          <div className="agent-stat-val">{agent.uptime}</div>
          <div className="agent-stat-lbl">Uptime</div>
        </div>
      </div>

      {/* Capability bars */}
      <div style={{ marginBottom: 12 }}>
        {getCapabilities(agent).map(cap => (
          <div key={cap.name} style={{ display:'flex',alignItems:'center',gap:8,marginBottom:5 }}>
            <span style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)',width:72,flexShrink:0 }}>{cap.name}</span>
            <div style={{ flex:1,height:4,background:'var(--bg-hover)',borderRadius:2,overflow:'hidden' }}>
              <div style={{
                height:'100%',borderRadius:2,
                background:`linear-gradient(90deg, ${agent.color}88, ${agent.color})`,
                width:`${cap.val}%`,transition:'width 1.2s ease',
              }}/>
            </div>
            <span style={{ fontFamily:'var(--font-mono)',fontSize:9,color:agent.color,width:28,textAlign:'right' }}>{cap.val}</span>
          </div>
        ))}
      </div>

      <div className="agent-tags">
        {(agent.tags || []).map(tag => <span className="agent-tag" key={tag}># {tag}</span>)}
      </div>

      <div className="agent-footer">
        <span className="agent-last-action">Last: {agent.lastAction}</span>
        <div style={{ display:'flex',gap:8 }}>
          <button
            className="btn btn-outline"
            style={{ padding:'5px 10px',fontSize:11 }}
            onClick={onEdit}
          >✏ EDIT</button>
          <button
            className="btn"
            style={{ padding:'5px 10px',fontSize:11,background:agent.color,borderColor:'transparent',color:'var(--bg-primary)' }}
            onClick={onEdit}
          >BRIEF →</button>
        </div>
      </div>
    </div>
  )
}

function getCapabilities(agent) {
  // derive pseudo-capabilities from agent role keywords
  const defaults = [
    { name: 'EXECUTION', val: 85 },
    { name: 'ANALYSIS', val: 80 },
    { name: 'CREATIVITY', val: 75 },
  ]
  const map = {
    'Research': [{ name:'RESEARCH',val:96 },{ name:'ANALYSIS',val:94 },{ name:'WRITING',val:82 }],
    'Growth': [{ name:'STRATEGY',val:91 },{ name:'MARKETING',val:95 },{ name:'ANALYTICS',val:88 }],
    'Code': [{ name:'CODING',val:98 },{ name:'DEVOPS',val:92 },{ name:'TESTING',val:95 }],
    'Content': [{ name:'WRITING',val:97 },{ name:'SEO',val:89 },{ name:'CREATIVITY',val:93 }],
    'Operations': [{ name:'AUTOMATION',val:96 },{ name:'INTEGRATION',val:93 },{ name:'OPS',val:91 }],
    'Finance': [{ name:'FINANCE',val:95 },{ name:'MODELING',val:92 },{ name:'RISK',val:88 }],
  }
  for (const key of Object.keys(map)) {
    if (agent.role.includes(key)) return map[key]
  }
  return defaults
}
