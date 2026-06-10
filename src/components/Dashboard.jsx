import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store/StoreContext'
import { useToast } from './Toast'
import { CreateTaskModal } from './TaskModal'
import { CreateAgentModal } from './AgentModal'

const LOG_MSG_TEMPLATES = [
  { type: 'info',    msgs: ['Web crawl complete — {n} URLs indexed', 'Report section drafted — {w} words', 'Citation check passed — {n} sources'] },
  { type: 'success', msgs: ['ROAS improved +{n}% on campaign', 'A/B test variant B winning at {n}% confidence', 'Audience updated — {n}K users'] },
  { type: 'code',    msgs: ['Refactor complete — complexity -{n}%', 'Tests passing: {n}/{n} green', 'Image built — {n}MB optimized'] },
  { type: 'info',    msgs: ['{n} posts scheduled in batch', 'SEO score: {n}/100', '{n} sections outlined'] },
  { type: 'success', msgs: ['Workflow: {n} steps completed', 'Sync: {n} records updated', '{n} automations triggered'] },
  { type: 'warning', msgs: ['API latency {n}ms — retrying', 'Rate limit at {n}% — throttling', 'Memory {n}% — optimizing'] },
]

export default function Dashboard() {
  const { tasks, agents, missions, exportData, resetData } = useAppStore()
  const toast = useToast()
  const [feed, setFeed] = useState([])
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showCreateAgent, setShowCreateAgent] = useState(false)
  const agentsRef = useRef(agents)
  useEffect(() => { agentsRef.current = agents }, [agents])

  // Seed initial feed from real agents on mount
  useEffect(() => {
    const now = new Date()
    const ts = () => [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2,'0')).join(':')
    const seed = (agentsRef.current.length ? agentsRef.current : []).slice(0, 5).map((agent, i) => {
      const tpl = LOG_MSG_TEMPLATES[i % LOG_MSG_TEMPLATES.length]
      const msgTpl = tpl.msgs[0]
      const msg = msgTpl.replace(/{n}/g, () => Math.floor(Math.random()*900+10)).replace(/{w}/g, () => Math.floor(Math.random()*2000+200))
      return { id: i, time: ts(), agent: agent.name, type: tpl.type, msg }
    })
    setFeed(seed)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      const currentAgents = agentsRef.current
      if (!currentAgents.length) return
      const agent = currentAgents[Math.floor(Math.random() * currentAgents.length)]
      const tpl = LOG_MSG_TEMPLATES[Math.floor(Math.random() * LOG_MSG_TEMPLATES.length)]
      const msgTpl = tpl.msgs[Math.floor(Math.random() * tpl.msgs.length)]
      const msg = msgTpl
        .replace(/{n}/g, () => Math.floor(Math.random() * 900 + 10))
        .replace(/{w}/g, () => Math.floor(Math.random() * 2000 + 200))
      const now = new Date()
      const ts = [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2,'0')).join(':')
      setFeed(prev => [{ id: Date.now(), time: ts, agent: agent.name, type: tpl.type, msg }, ...prev].slice(0, 8))
    }, 3000)
    return () => clearInterval(t)
  }, [])

  const activeAgents = agents.filter(a => a.status === 'active').length
  const liveTasks = tasks.filter(t => t.col === 'active').length
  const deployedTasks = tasks.filter(t => t.col === 'deployed').length

  const METRICS = [
    { label: 'ACTIVE AGENTS', value: String(activeAgents), sub: `${agents.length} total fleet`, color: '#00F5FF', icon: '◈' },
    { label: 'LIVE TASKS', value: String(liveTasks), sub: `${tasks.length} total tasks`, color: '#7B2FFF', icon: '▦' },
    { label: 'TASKS DEPLOYED', value: String(deployedTasks), sub: `${tasks.length > 0 ? Math.round((deployedTasks/tasks.length)*100) : 0}% completion rate`, color: '#00E676', icon: '🚀' },
    { label: 'MISSIONS ACTIVE', value: String(missions.length), sub: 'campaigns running', color: '#FFB800', icon: '◎' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">HOMEBASE</div>
          <div className="page-subtitle">NEXUS OS · AI AGENT COMMAND CENTER · {new Date().toDateString().toUpperCase()}</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => {
            if (window.confirm('Reset all data to defaults?')) { resetData(); toast('Data reset to defaults', 'info') }
          }}>↺ RESET</button>
          <button className="btn btn-outline" onClick={exportData}>⬇ EXPORT</button>
          <button className="btn btn-outline" onClick={() => setShowCreateAgent(true)}>+ AGENT</button>
          <button className="btn btn-primary" onClick={() => setShowCreateTask(true)}>+ TASK</button>
        </div>
      </div>

      {/* Metrics */}
      <div className="metric-grid">
        {METRICS.map((m, i) => (
          <div className="metric-card" key={m.label} style={{ '--accent-color': m.color, animationDelay: `${i*0.1}s` }}>
            <div className="metric-trend">{m.icon}</div>
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
            <div className="metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Missions */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-icon" style={{background:'rgba(123,47,255,0.15)'}}>◎</div>
            <div>
              <div className="panel-title">ACTIVE MISSIONS</div>
              <div className="panel-sub">Multi-agent campaign tracker</div>
            </div>
            <div className="panel-badge" style={{color:'var(--violet)',borderColor:'var(--violet)',background:'var(--violet-dim)'}}>
              {missions.length} active
            </div>
          </div>
          <div className="panel-body" style={{ display:'flex',flexDirection:'column',gap:16 }}>
            {missions.length === 0 && (
              <div style={{textAlign:'center',padding:'16px',fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-muted)'}}>
                No missions yet. Go to Mission Control to create one.
              </div>
            )}
            {missions.map(m => (
              <div key={m.id} style={{borderBottom:'1px solid var(--border)',paddingBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                  <span style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>{m.label}</span>
                  <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-muted)'}}>Due {m.due}</span>
                </div>
                <div style={{display:'flex',gap:4,marginBottom:8,flexWrap:'wrap'}}>
                  {(m.agents || []).map(aid => {
                    const ag = agents.find(a => a.id === aid)
                    return ag ? (
                      <span key={aid} style={{
                        fontFamily:'var(--font-mono)',fontSize:9,padding:'1px 7px',
                        borderRadius:4,border:'1px solid var(--border)',background:'var(--bg-card)',color:ag.color,
                      }}>{ag.name}</span>
                    ) : null
                  })}
                </div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-muted)'}}>PROGRESS</span>
                  <span style={{fontFamily:'var(--font-brand)',fontSize:12,fontWeight:700,color:'var(--cyan)'}}>{m.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width:`${m.progress}%`}}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Feed */}
        <div className="panel" style={{background:'#080C14'}}>
          <div className="panel-header" style={{background:'#0D1018'}}>
            <div className="panel-icon" style={{background:'rgba(0,230,118,0.1)'}}>▶</div>
            <div>
              <div className="panel-title">AGENT LIVE FEED</div>
              <div className="panel-sub">Real-time activity stream</div>
            </div>
            <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:5,fontFamily:'var(--font-mono)',fontSize:10,color:'var(--green)'}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:'var(--green)',animation:'pulse-green 1s infinite'}}/>
              LIVE
            </div>
          </div>
          <div className="panel-body" style={{fontFamily:'var(--font-mono)',fontSize:11,lineHeight:1.9,display:'flex',flexDirection:'column',gap:2,padding:'12px 16px'}}>
            {feed.map(entry => (
              <div key={entry.id} className={`term-line term-type-${entry.type}`} style={{animation:'float-up 0.3s ease'}}>
                <span className="term-time">{entry.time}</span>
                <span className="term-agent" style={{minWidth:56}}>[{entry.agent}]</span>
                <span className="term-msg">{entry.msg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fleet Quick Status */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-icon" style={{background:'rgba(0,245,255,0.1)'}}>◈</div>
            <div>
              <div className="panel-title">FLEET STATUS</div>
              <div className="panel-sub">Agent deployment overview</div>
            </div>
          </div>
          <div className="panel-body" style={{display:'flex',flexDirection:'column',gap:10}}>
            {agents.length === 0 && (
              <div style={{textAlign:'center',padding:'16px',fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-muted)'}}>
                No agents yet. Click "+ AGENT" above.
              </div>
            )}
            {agents.map(agent => {
              const agentTasks = tasks.filter(t => t.agent === agent.id && t.col === 'active').length
              return (
                <div key={agent.id} style={{
                  display:'flex',alignItems:'center',gap:12,padding:'10px 12px',
                  background:'var(--bg-card)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',
                }}>
                  <span style={{fontSize:18}}>{agent.avatar}</span>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                      <span style={{fontFamily:'var(--font-brand)',fontSize:12,fontWeight:700,color:agent.color,letterSpacing:1}}>{agent.name}</span>
                      <span style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)'}}>{agent.role}</span>
                    </div>
                    <div style={{height:3,background:'var(--bg-hover)',borderRadius:2,overflow:'hidden'}}>
                      <div style={{
                        height:'100%',borderRadius:2,
                        background:`linear-gradient(90deg, ${agent.color}88, ${agent.color})`,
                        width:`${Math.min((agentTasks / 10)*100, 100)}%`,transition:'width 1s ease',
                      }}/>
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontFamily:'var(--font-brand)',fontSize:14,fontWeight:700,color:agent.color}}>{agentTasks}</div>
                    <div style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)'}}>tasks</div>
                  </div>
                  <div className={`agent-mini-status status-${agent.status}`}/>
                </div>
              )
            })}
          </div>
        </div>

        {/* Velocity Sparkline */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-icon" style={{background:'rgba(255,184,0,0.1)'}}>📊</div>
            <div>
              <div className="panel-title">TASK VELOCITY</div>
              <div className="panel-sub">Pipeline distribution</div>
            </div>
          </div>
          <div className="panel-body">
            <PipelineViz tasks={tasks}/>
          </div>
        </div>
      </div>

      {showCreateTask && <CreateTaskModal onClose={() => { setShowCreateTask(false); toast('Task created!', 'success') }} />}
      {showCreateAgent && <CreateAgentModal onClose={() => { setShowCreateAgent(false); toast('Agent deployed!', 'success') }} />}
    </div>
  )
}

function PipelineViz({ tasks }) {
  const cols = [
    { id:'backlog', label:'BACKLOG', color:'#4A5568' },
    { id:'briefed', label:'BRIEFED', color:'#FFB800' },
    { id:'active', label:'ACTIVE', color:'#00F5FF' },
    { id:'review', label:'REVIEW', color:'#7B2FFF' },
    { id:'deployed', label:'DONE', color:'#00E676' },
  ]
  const total = tasks.length || 1
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {cols.map(col => {
        const count = tasks.filter(t => t.col === col.id).length
        const pct = (count / total) * 100
        return (
          <div key={col.id} style={{display:'flex',alignItems:'center',gap:12}}>
            <span style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)',width:60,flexShrink:0}}>{col.label}</span>
            <div style={{flex:1,height:18,background:'var(--bg-hover)',borderRadius:4,overflow:'hidden',position:'relative'}}>
              <div style={{
                position:'absolute',top:0,left:0,bottom:0,
                width:`${pct}%`,minWidth:count>0?4:0,
                background:`linear-gradient(90deg, ${col.color}66, ${col.color})`,
                borderRadius:4,transition:'width 1s ease',
              }}/>
              {count > 0 && (
                <span style={{
                  position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',
                  fontFamily:'var(--font-mono)',fontSize:9,fontWeight:700,
                  color: pct > 20 ? 'var(--bg-primary)' : col.color,
                  zIndex:1,
                }}>{count}</span>
              )}
            </div>
            <span style={{fontFamily:'var(--font-brand)',fontSize:13,fontWeight:700,color:col.color,width:32,textAlign:'right'}}>{count}</span>
          </div>
        )
      })}
      <div style={{marginTop:8,display:'flex',justifyContent:'space-between',borderTop:'1px solid var(--border)',paddingTop:10}}>
        {[
          {label:'TOTAL TASKS',val:tasks.length,color:'var(--text-primary)'},
          {label:'ACTIVE',val:tasks.filter(t=>t.col==='active').length,color:'var(--cyan)'},
          {label:'DONE',val:tasks.filter(t=>t.col==='deployed').length,color:'var(--green)'},
        ].map(s=>(
          <div key={s.label} style={{textAlign:'center'}}>
            <div style={{fontFamily:'var(--font-brand)',fontSize:18,fontWeight:700,color:s.color}}>{s.val}</div>
            <div style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)',marginTop:1}}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
