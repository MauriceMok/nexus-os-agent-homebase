import { useState } from 'react'
import Modal, { Field, Input, Textarea, Select, FormRow, ModalActions } from './Modal'
import { useAppStore } from '../store/StoreContext'

const MODEL_OPTS = [
  { value: 'GPT-4o', label: 'GPT-4o' },
  { value: 'Claude 3.5', label: 'Claude 3.5 Sonnet' },
  { value: 'Gemini 1.5', label: 'Gemini 1.5 Pro' },
  { value: 'Llama 3.1', label: 'Llama 3.1 405B' },
  { value: 'Mistral Large', label: 'Mistral Large' },
]

const AVATAR_OPTS = ['🤖','🔬','📈','⚡','✍️','💎','🧠','🎯','🔍','🛡️','🚀','⚙️']

const COLOR_OPTS = [
  { value: '#00F5FF', label: '⬤ Cyan' },
  { value: '#7B2FFF', label: '⬤ Violet' },
  { value: '#FF3E6C', label: '⬤ Coral' },
  { value: '#FFB800', label: '⬤ Gold' },
  { value: '#00E676', label: '⬤ Green' },
  { value: '#FF6B2B', label: '⬤ Orange' },
  { value: '#E040FB', label: '⬤ Purple' },
]

const EMPTY_FORM = {
  name: '', role: '', specialty: '', avatar: '🤖',
  color: '#00F5FF', model: 'GPT-4o', tags: '',
}

export function CreateAgentModal({ onClose }) {
  const { createAgent } = useAppStore()
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Agent name is required.'); return }
    if (!form.role.trim()) { setError('Agent role is required.'); return }
    createAgent({
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
    onClose()
  }

  return (
    <Modal title="DEPLOY NEW AGENT" subtitle="Add an AI agent to your fleet" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormRow>
          <Field label="Agent Codename" required>
            <Input value={form.name} onChange={set('name')} placeholder="e.g. NEXUS, STORM" />
          </Field>
          <Field label="Avatar">
            <select className="field-input field-select" value={form.avatar} onChange={e => set('avatar')(e.target.value)}>
              {AVATAR_OPTS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
        </FormRow>
        <Field label="Role / Title" required>
          <Input value={form.role} onChange={set('role')} placeholder="e.g. Growth Strategist, Code Architect" />
        </Field>
        <Field label="Specialty">
          <Input value={form.specialty} onChange={set('specialty')} placeholder="e.g. Campaign Optimization, Full-Stack Dev" />
        </Field>
        <FormRow>
          <Field label="AI Model">
            <Select value={form.model} onChange={set('model')} options={MODEL_OPTS} />
          </Field>
          <Field label="Color Theme">
            <Select value={form.color} onChange={set('color')} options={COLOR_OPTS} />
          </Field>
        </FormRow>
        <Field label="Tags (comma separated)">
          <Input value={form.tags} onChange={set('tags')} placeholder="research, code, marketing" />
        </Field>
        {error && <div className="form-error">{error}</div>}

        {/* Preview */}
        <div style={{
          display:'flex',alignItems:'center',gap:14,marginBottom:16,
          padding:'12px 16px',background:'var(--bg-card)',borderRadius:'var(--radius-sm)',
          border:`1px solid ${form.color}44`,
        }}>
          <div style={{
            width:44,height:44,borderRadius:10,background:'var(--bg-surface)',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:22,border:`2px solid ${form.color}`,
          }}>{form.avatar}</div>
          <div>
            <div style={{fontFamily:'var(--font-brand)',fontSize:14,fontWeight:700,color:form.color,letterSpacing:2}}>
              {form.name.toUpperCase() || 'AGENT NAME'}
            </div>
            <div style={{fontSize:12,color:'var(--text-secondary)'}}>{form.role || 'Role'}</div>
            <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-muted)'}}>{form.model}</div>
          </div>
        </div>

        <ModalActions>
          <button type="button" className="btn btn-outline" onClick={onClose}>CANCEL</button>
          <button type="submit" className="btn btn-primary">DEPLOY AGENT →</button>
        </ModalActions>
      </form>
    </Modal>
  )
}

export function EditAgentModal({ agent, onClose }) {
  const { updateAgent } = useAppStore()
  const [form, setForm] = useState({
    name: agent.name,
    role: agent.role,
    specialty: agent.specialty || '',
    avatar: agent.avatar,
    color: agent.color,
    model: agent.model,
    tags: (agent.tags || []).join(', '),
    status: agent.status,
  })
  const [error, setError] = useState('')

  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Agent name is required.'); return }
    updateAgent(agent.id, {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
    onClose()
  }

  const STATUS_OPTS = [
    { value: 'active', label: '◉ Active' },
    { value: 'idle', label: '● Idle' },
    { value: 'standby', label: '○ Standby' },
  ]

  return (
    <Modal title="EDIT AGENT" subtitle={`Editing: ${agent.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormRow>
          <Field label="Agent Codename" required>
            <Input value={form.name} onChange={set('name')} placeholder="Codename" />
          </Field>
          <Field label="Avatar">
            <select className="field-input field-select" value={form.avatar} onChange={e => set('avatar')(e.target.value)}>
              {AVATAR_OPTS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
        </FormRow>
        <Field label="Role / Title" required>
          <Input value={form.role} onChange={set('role')} placeholder="Role" />
        </Field>
        <Field label="Specialty">
          <Input value={form.specialty} onChange={set('specialty')} placeholder="Specialty" />
        </Field>
        <FormRow>
          <Field label="AI Model">
            <Select value={form.model} onChange={set('model')} options={MODEL_OPTS} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={set('status')} options={STATUS_OPTS} />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Color Theme">
            <Select value={form.color} onChange={set('color')} options={COLOR_OPTS} />
          </Field>
          <Field label="Tags">
            <Input value={form.tags} onChange={set('tags')} placeholder="tag1, tag2" />
          </Field>
        </FormRow>
        {error && <div className="form-error">{error}</div>}
        <ModalActions>
          <button type="button" className="btn btn-outline" onClick={onClose}>CANCEL</button>
          <button type="submit" className="btn btn-primary">SAVE CHANGES →</button>
        </ModalActions>
      </form>
    </Modal>
  )
}
