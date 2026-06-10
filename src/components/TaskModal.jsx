import { useState } from 'react'
import Modal, { Field, Input, Textarea, Select, FormRow, ModalActions } from './Modal'
import { COLUMNS } from '../data/kanban'
import { useAppStore } from '../store/StoreContext'

const PRIORITY_OPTS = [
  { value: 'critical', label: '🔴 Critical' },
  { value: 'high', label: '🟡 High' },
  { value: 'medium', label: '🔵 Medium' },
  { value: 'low', label: '⚪ Low' },
]

const COL_OPTS = COLUMNS.map(c => ({ value: c.id, label: `${c.icon} ${c.label}` }))

export function CreateTaskModal({ onClose, defaultCol = 'backlog' }) {
  const { createTask, agents } = useAppStore()
  const [form, setForm] = useState({
    title: '', desc: '', agent: '', priority: 'medium',
    col: defaultCol, eta: '', tags: '',
  })
  const [error, setError] = useState('')

  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Task title is required.'); return }
    createTask({
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      eta: form.eta || '—',
    })
    onClose()
  }

  const agentOpts = [
    { value: '', label: '— Unassigned —' },
    ...agents.map(a => ({ value: a.id, label: `${a.avatar} ${a.name} · ${a.role}` })),
  ]

  return (
    <Modal title="CREATE TASK" subtitle="Add a new operation to the command board" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Task Title" required>
          <Input value={form.title} onChange={set('title')} placeholder="e.g. Competitor Analysis Report" />
        </Field>
        <Field label="Description">
          <Textarea value={form.desc} onChange={set('desc')} placeholder="What should the agent accomplish?" />
        </Field>
        <FormRow>
          <Field label="Assign Agent">
            <Select value={form.agent} onChange={set('agent')} options={agentOpts} />
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={set('priority')} options={PRIORITY_OPTS} />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Stage">
            <Select value={form.col} onChange={set('col')} options={COL_OPTS} />
          </Field>
          <Field label="ETA">
            <Input value={form.eta} onChange={set('eta')} placeholder="e.g. 2h, 30m" />
          </Field>
        </FormRow>
        <Field label="Tags (comma separated)">
          <Input value={form.tags} onChange={set('tags')} placeholder="research, seo, code" />
        </Field>
        {error && <div className="form-error">{error}</div>}
        <ModalActions>
          <button type="button" className="btn btn-outline" onClick={onClose}>CANCEL</button>
          <button type="submit" className="btn btn-primary">CREATE TASK →</button>
        </ModalActions>
      </form>
    </Modal>
  )
}

export function EditTaskModal({ task, onClose }) {
  const { updateTask, agents } = useAppStore()
  const [form, setForm] = useState({
    title: task.title,
    desc: task.desc || '',
    agent: task.agent || '',
    priority: task.priority,
    col: task.col,
    eta: task.eta === '—' ? '' : task.eta,
    tags: (task.tags || []).join(', '),
  })
  const [error, setError] = useState('')

  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Task title is required.'); return }
    updateTask(task.id, {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      eta: form.eta || '—',
    })
    onClose()
  }

  const agentOpts = [
    { value: '', label: '— Unassigned —' },
    ...agents.map(a => ({ value: a.id, label: `${a.avatar} ${a.name} · ${a.role}` })),
  ]

  return (
    <Modal title="EDIT TASK" subtitle={`Editing: ${task.title}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Task Title" required>
          <Input value={form.title} onChange={set('title')} placeholder="Task title" />
        </Field>
        <Field label="Description">
          <Textarea value={form.desc} onChange={set('desc')} placeholder="Description" />
        </Field>
        <FormRow>
          <Field label="Assign Agent">
            <Select value={form.agent} onChange={set('agent')} options={agentOpts} />
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={set('priority')} options={PRIORITY_OPTS} />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Stage">
            <Select value={form.col} onChange={set('col')} options={COL_OPTS} />
          </Field>
          <Field label="ETA">
            <Input value={form.eta} onChange={set('eta')} placeholder="e.g. 2h" />
          </Field>
        </FormRow>
        <Field label="Tags (comma separated)">
          <Input value={form.tags} onChange={set('tags')} placeholder="research, seo, code" />
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
