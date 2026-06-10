import { useState } from 'react'
import Modal, { Field, Input, Select, FormRow, ModalActions } from './Modal'
import { useAppStore } from '../store/StoreContext'

export function CreateMissionModal({ onClose }) {
  const { createMission, agents } = useAppStore()
  const [form, setForm] = useState({ label: '', due: '', agents: [] })
  const [error, setError] = useState('')

  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }))

  const toggleAgent = (id) => {
    setForm(p => ({
      ...p,
      agents: p.agents.includes(id) ? p.agents.filter(a => a !== id) : [...p.agents, id],
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.label.trim()) { setError('Mission name is required.'); return }
    createMission(form)
    onClose()
  }

  return (
    <Modal title="CREATE MISSION" subtitle="Launch a new multi-agent campaign" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Mission Name" required>
          <Input value={form.label} onChange={set('label')} placeholder="e.g. Q4 Product Launch" />
        </Field>
        <Field label="Due Date">
          <Input value={form.due} onChange={set('due')} placeholder="e.g. Jul 15" />
        </Field>
        <Field label="Assign Agents">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {agents.map(a => (
              <button
                type="button"
                key={a.id}
                onClick={() => toggleAgent(a.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
                  border: `1px solid ${form.agents.includes(a.id) ? a.color : 'var(--border)'}`,
                  background: form.agents.includes(a.id) ? `${a.color}22` : 'var(--bg-card)',
                  color: form.agents.includes(a.id) ? a.color : 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  transition: 'all 0.2s',
                }}
              >
                <span>{a.avatar}</span>
                <span>{a.name}</span>
              </button>
            ))}
          </div>
        </Field>
        {error && <div className="form-error">{error}</div>}
        <ModalActions>
          <button type="button" className="btn btn-outline" onClick={onClose}>CANCEL</button>
          <button type="submit" className="btn btn-primary">LAUNCH MISSION →</button>
        </ModalActions>
      </form>
    </Modal>
  )
}

export function EditMissionModal({ mission, onClose }) {
  const { updateMission, agents } = useAppStore()
  const [form, setForm] = useState({
    label: mission.label,
    due: mission.due,
    agents: mission.agents || [],
    progress: mission.progress,
  })
  const [error, setError] = useState('')

  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }))

  const toggleAgent = (id) => {
    setForm(p => ({
      ...p,
      agents: p.agents.includes(id) ? p.agents.filter(a => a !== id) : [...p.agents, id],
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.label.trim()) { setError('Mission name is required.'); return }
    updateMission(mission.id, { ...form, progress: Number(form.progress) })
    onClose()
  }

  return (
    <Modal title="EDIT MISSION" subtitle={`Editing: ${mission.label}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Mission Name" required>
          <Input value={form.label} onChange={set('label')} placeholder="Mission name" />
        </Field>
        <FormRow>
          <Field label="Due Date">
            <Input value={form.due} onChange={set('due')} placeholder="e.g. Jul 15" />
          </Field>
          <Field label="Progress (0–100)">
            <Input value={form.progress} onChange={set('progress')} type="number" placeholder="0" />
          </Field>
        </FormRow>
        <Field label="Assigned Agents">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {agents.map(a => (
              <button
                type="button"
                key={a.id}
                onClick={() => toggleAgent(a.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
                  border: `1px solid ${form.agents.includes(a.id) ? a.color : 'var(--border)'}`,
                  background: form.agents.includes(a.id) ? `${a.color}22` : 'var(--bg-card)',
                  color: form.agents.includes(a.id) ? a.color : 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  transition: 'all 0.2s',
                }}
              >
                <span>{a.avatar}</span>
                <span>{a.name}</span>
              </button>
            ))}
          </div>
        </Field>
        {error && <div className="form-error">{error}</div>}
        <ModalActions>
          <button type="button" className="btn btn-outline" onClick={onClose}>CANCEL</button>
          <button type="submit" className="btn btn-primary">SAVE CHANGES →</button>
        </ModalActions>
      </form>
    </Modal>
  )
}
