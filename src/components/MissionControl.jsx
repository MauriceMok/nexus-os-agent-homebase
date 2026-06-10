import { useState } from 'react'
import { useAppStore } from '../store/StoreContext'
import { useToast } from './Toast'
import { CreateMissionModal, EditMissionModal } from './MissionModal'
import { ConfirmModal } from './Modal'

// Build real weekly data from taskHistory
function buildWeekData(taskHistory) {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().slice(0, 10)
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
    return { day: dayName, deployed: taskHistory[key] || 0 }
  })
}

export default function MissionControl() {
  const { tasks, agents, missions, taskHistory, deleteMission, exportData } = useAppStore()
  const toast = useToast()
  const [showCreate, setShowCreate] = useState(false)
  const [editMission, setEditMission] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const deployed = tasks.filter(t => t.col === 'deployed').length
  const active = tasks.filter(t => t.col === 'active').length
  const review = tasks.filter(t => t.col === 'review').length
  const totalTasks = tasks.length

  const completionRate = totalTasks > 0 ? Math.round((deployed / totalTasks) * 100) : 0

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">MISSION CONTROL</div>
          <div className="page-subtitle">Analytics, KPIs & Agent Performance Intelligence</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={exportData}>⬇ FULL REPORT</button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ NEW MISSION</button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24 }}>
        {[
          { label:'COMPLETION RATE', val:`${completionRate}%`, sub:`${deployed} of ${totalTasks} tasks`, color:'var(--green)', icon:'✓' },
          { label:'ACTIVE TASKS', val:active, sub:'currently in flight', color:'var(--cyan)', icon:'⚡' },
          { label:'ACTIVE AGENTS', val:agents.filter(a=>a.status==='active').length, sub:`of ${agents.length} deployed`, color:'var(--violet)', icon:'◈' },
          { label:'MISSIONS RUNNING', val:missions.length, sub:'active campaigns', color:'var(--gold)', icon:'◎' },
        ].map((k,i) => (
          <div key={i} className="metric-card" style={{'--accent-color':k.color}}>
            <div className="metric-trend">{k.icon}</div>
            <div className="metric-label">{k.label}</div>
            <div className="metric-value" style={{fontSize:28}}>{k.val}</div>
            <div className="metric-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20 }}>
        {/* Active Missions */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-icon" style={{background:'var(--violet-dim)'}}>◎</div>
            <div>
              <div className="panel-title">ACTIVE MISSIONS</div>
              <div className="panel-sub">{missions.length} campaign{missions.length !== 1 ? 's' : ''} in progress</div>
            </div>
            <button className="btn btn-primary" style={{fontSize:10,padding:'4px 10px',marginLeft:'auto'}}
              onClick={() => setShowCreate(true)}>+ NEW</button>
          </div>
          <div className="panel-body" style={{ display:'flex',flexDirection:'column',gap:18 }}>
            {missions.length === 0 && (
              <div style={{textAlign:'center',padding:'24px',fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-muted)'}}>
                No missions yet. Create one above.
              </div>
            )}
            {missions.map(m => {
              const urgency = m.progress < 50 ? 'var(--coral)' : m.progress < 75 ? 'var(--gold)' : 'var(--green)'
              return (
                <div key={m.id}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                    <div>
                      <div style={{ fontSize:13,fontWeight:600,color:'var(--text-primary)',marginBottom:3 }}>{m.label}</div>
                      <div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
                        {(m.agents || []).map(aid => {
                          const ag = agents.find(a => a.id === aid)
                          return ag ? (
                            <span key={aid} style={{
                              fontFamily:'var(--font-mono)',fontSize:9,padding:'1px 6px',
                              borderRadius:3,background:'var(--bg-card)',color:ag.color,
                              border:`1px solid ${ag.color}44`,
                            }}>{ag.avatar} {ag.name}</span>
                          ) : null
                        })}
                      </div>
                    </div>
                    <div style={{ textAlign:'right',flexShrink:0,marginLeft:8 }}>
                      <div style={{ fontFamily:'var(--font-brand)',fontSize:20,fontWeight:700,color:urgency }}>{m.progress}%</div>
                      <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)' }}>Due {m.due}</div>
                      <div style={{ display:'flex',gap:4,marginTop:4 }}>
                        <button className="btn btn-outline" style={{fontSize:9,padding:'2px 6px'}}
                          onClick={() => setEditMission(m)}>✏</button>
                        <button className="btn btn-outline" style={{fontSize:9,padding:'2px 6px',borderColor:'var(--coral)',color:'var(--coral)'}}
                          onClick={() => setDeleteConfirm(m)}>✕</button>
                      </div>
                    </div>
                  </div>
                  <div className="progress-bar" style={{ height:8 }}>
                    <div className="progress-fill" style={{
                      width:`${m.progress}%`,
                      background:`linear-gradient(90deg, ${urgency}88, ${urgency})`,
                    }}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Task Pipeline Donut */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-icon" style={{background:'var(--cyan-dim)'}}>▦</div>
            <div>
              <div className="panel-title">TASK PIPELINE</div>
              <div className="panel-sub">Current operations breakdown</div>
            </div>
          </div>
          <div className="panel-body">
            <DonutChart deployed={deployed} active={active} review={review} total={totalTasks}/>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginTop:20 }}>
              {[
                {label:'BACKLOG',count:tasks.filter(t=>t.col==='backlog').length,color:'#4A5568'},
                {label:'BRIEFED',count:tasks.filter(t=>t.col==='briefed').length,color:'var(--gold)'},
                {label:'ACTIVE',count:active,color:'var(--cyan)'},
                {label:'REVIEW',count:review,color:'var(--violet)'},
                {label:'DEPLOYED',count:deployed,color:'var(--green)'},
                {label:'TOTAL',count:totalTasks,color:'var(--text-primary)'},
              ].map(s => (
                <div key={s.label} style={{
                  display:'flex',justifyContent:'space-between',alignItems:'center',
                  padding:'8px 12px',background:'var(--bg-card)',borderRadius:'var(--radius-sm)',
                }}>
                  <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-muted)'}}>{s.label}</span>
                  <span style={{fontFamily:'var(--font-brand)',fontSize:16,fontWeight:700,color:s.color}}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Bar Chart — real data */}
      <div className="panel" style={{marginBottom:20}}>
        <div className="panel-header">
          <div className="panel-icon" style={{background:'var(--gold-dim)'}}>📈</div>
          <div>
            <div className="panel-title">WEEKLY PERFORMANCE</div>
            <div className="panel-sub">Tasks deployed per day — last 7 days (live)</div>
          </div>
        </div>
        <div className="panel-body"><WeeklyChart data={buildWeekData(taskHistory)}/></div>
      </div>

      {/* Agent Leaderboard */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-icon" style={{background:'var(--violet-dim)'}}>🏆</div>
          <div>
            <div className="panel-title">AGENT PERFORMANCE LEADERBOARD</div>
            <div className="panel-sub">Ranked by tasks completed all-time</div>
          </div>
        </div>
        <div className="panel-body">
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            {[...agents].sort((a,b) => b.completed - a.completed).map((agent, i) => (
              <div key={agent.id} style={{
                display:'flex',alignItems:'center',gap:14,
                padding:'12px 14px',background:'var(--bg-card)',
                borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',
                borderLeft:`3px solid ${agent.color}`,
              }}>
                <div style={{
                  fontFamily:'var(--font-brand)',fontSize:18,fontWeight:800,width:28,textAlign:'center',
                  color: i===0?'var(--gold)':i===1?'var(--text-secondary)':i===2?'#cd7f32':'var(--text-muted)',
                }}>#{i+1}</div>
                <span style={{fontSize:20}}>{agent.avatar}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                    <span style={{fontFamily:'var(--font-brand)',fontSize:14,color:agent.color,letterSpacing:1}}>{agent.name}</span>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-muted)'}}>{agent.role}</span>
                  </div>
                  <div style={{ height:4,background:'var(--bg-hover)',borderRadius:2,overflow:'hidden' }}>
                    <div style={{
                      height:'100%',borderRadius:2,
                      background:`linear-gradient(90deg, ${agent.color}66, ${agent.color})`,
                      width: agents.length ? `${(agent.completed / Math.max(...agents.map(a=>a.completed),1)) * 100}%` : '0%',
                      transition:'width 1.5s ease',
                    }}/>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{fontFamily:'var(--font-brand)',fontSize:20,fontWeight:700,color:agent.color}}>{agent.completed}</div>
                  <div style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)'}}>completed</div>
                </div>
                <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-muted)',textAlign:'right',minWidth:60}}>
                  <div style={{color:'var(--text-secondary)',marginBottom:1}}>{agent.uptime}</div>
                  <div>uptime</div>
                </div>
              </div>
            ))}
            {agents.length === 0 && (
              <div style={{textAlign:'center',padding:24,fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-muted)'}}>
                No agents deployed yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreate && <CreateMissionModal onClose={() => { setShowCreate(false); toast('Mission launched!', 'success') }} />}
      {editMission && <EditMissionModal mission={editMission} onClose={() => { setEditMission(null); toast('Mission updated', 'success') }} />}
      {deleteConfirm && (
        <ConfirmModal
          title="ABORT MISSION"
          message={`Permanently delete mission "${deleteConfirm.label}"?`}
          danger
          onConfirm={() => { deleteMission(deleteConfirm.id); toast('Mission aborted', 'info') }}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}

function DonutChart({ deployed, active, review, total }) {
  if (total === 0) return (
    <div style={{textAlign:'center',padding:24,fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-muted)'}}>
      No tasks yet
    </div>
  )
  const size = 140, r = 52, cx = size/2, cy = size/2
  const circ = 2 * Math.PI * r
  const segments = [
    { val: deployed, color: '#00E676', label: 'Deployed' },
    { val: active, color: '#00F5FF', label: 'Active' },
    { val: review, color: '#7B2FFF', label: 'Review' },
    { val: total - deployed - active - review, color: '#FFB800', label: 'Queued' },
  ]
  let offset = 0
  return (
    <div style={{ display:'flex',alignItems:'center',gap:20 }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-hover)" strokeWidth={14}/>
        {segments.map((seg, i) => {
          const pct = seg.val / total
          const dash = pct * circ
          const el = (
            <circle key={i} cx={cx} cy={cy} r={r}
              fill="none" stroke={seg.color} strokeWidth={14}
              strokeDasharray={`${dash} ${circ-dash}`}
              strokeDashoffset={circ*0.25 - offset*circ}
              style={{filter:`drop-shadow(0 0 4px ${seg.color}88)`}}
            />
          )
          offset += pct
          return el
        })}
        <text x={cx} y={cy-6} textAnchor="middle" fill="var(--cyan)"
          fontFamily="Orbitron" fontSize={20} fontWeight={700}>{total}</text>
        <text x={cx} y={cy+10} textAnchor="middle" fill="var(--text-muted)"
          fontFamily="JetBrains Mono" fontSize={9}>TASKS</text>
      </svg>
      <div style={{ flex:1,display:'flex',flexDirection:'column',gap:8 }}>
        {segments.map(seg => (
          <div key={seg.label} style={{ display:'flex',alignItems:'center',gap:8 }}>
            <div style={{ width:10,height:10,borderRadius:2,background:seg.color,flexShrink:0 }}/>
            <span style={{ fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-secondary)',flex:1 }}>{seg.label}</span>
            <span style={{ fontFamily:'var(--font-brand)',fontSize:14,color:seg.color,fontWeight:700 }}>{seg.val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function WeeklyChart({ data }) {
  const maxVal = Math.max(...data.map(d => d.deployed), 1)
  const total = data.reduce((s, d) => s + d.deployed, 0)
  return (
    <div style={{ position:'relative',paddingBottom:28 }}>
      {total === 0 && (
        <div style={{
          textAlign:'center',padding:'32px',fontFamily:'var(--font-mono)',
          fontSize:11,color:'var(--text-muted)',
        }}>
          No tasks deployed this week yet — move cards to DEPLOYED on the Kanban board to see data here.
        </div>
      )}
      {total > 0 && (
        <>
          <div style={{ display:'flex',gap:12,height:120,alignItems:'flex-end' }}>
            {data.map((d, i) => (
              <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,justifyContent:'flex-end' }}>
                {d.deployed > 0 && (
                  <span style={{fontFamily:'var(--font-brand)',fontSize:11,fontWeight:700,color:'var(--green)'}}>{d.deployed}</span>
                )}
                <div style={{
                  width:'100%',borderRadius:'3px 3px 0 0',minHeight:4,
                  height:`${(d.deployed/maxVal)*100}%`,
                  background:'linear-gradient(180deg,var(--green),rgba(0,230,118,0.15))',
                  transition:'height 1.2s ease',
                  boxShadow: d.deployed > 0 ? '0 0 8px rgba(0,230,118,0.4)' : 'none',
                }}/>
              </div>
            ))}
          </div>
          <div style={{ display:'flex',gap:12,marginTop:8 }}>
            {data.map((d, i) => (
              <div key={i} style={{flex:1,textAlign:'center',fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)'}}>
                {d.day}
              </div>
            ))}
          </div>
        </>
      )}
      <div style={{ display:'flex',alignItems:'center',gap:16,marginTop:12,paddingTop:8,borderTop:'1px solid var(--border)' }}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <div style={{width:12,height:4,borderRadius:2,background:'var(--green)'}}/>
          <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-muted)'}}>Deployed this week</span>
        </div>
        <span style={{fontFamily:'var(--font-brand)',fontSize:14,fontWeight:700,color:'var(--green)',marginLeft:'auto'}}>
          {total} total
        </span>
      </div>
    </div>
  )
}
