import { useEffect, useRef } from 'react'

export default function Modal({ title, subtitle, onClose, children, width = 520 }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="modal-panel" style={{ maxWidth: width }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{title}</div>
            {subtitle && <div className="modal-subtitle">{subtitle}</div>}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, children, required }) {
  return (
    <div className="field">
      <label className="field-label">
        {label}{required && <span style={{color:'var(--coral)',marginLeft:3}}>*</span>}
      </label>
      {children}
    </div>
  )
}

export function Input({ value, onChange, placeholder, type = 'text', ...rest }) {
  return (
    <input
      className="field-input"
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      {...rest}
    />
  )
}

export function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      className="field-input field-textarea"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
  )
}

export function Select({ value, onChange, options }) {
  return (
    <select
      className="field-input field-select"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

export function FormRow({ children }) {
  return <div className="form-row">{children}</div>
}

export function ModalActions({ children }) {
  return <div className="modal-actions">{children}</div>
}

export function ConfirmModal({ title, message, onConfirm, onClose, danger }) {
  return (
    <Modal title={title} onClose={onClose} width={420}>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
        {message}
      </p>
      <ModalActions>
        <button className="btn btn-outline" onClick={onClose}>CANCEL</button>
        <button
          className="btn"
          style={danger
            ? { background: 'var(--coral)', borderColor: 'transparent', color: '#fff' }
            : { background: 'var(--cyan)', borderColor: 'transparent', color: 'var(--bg-primary)' }
          }
          onClick={() => { onConfirm(); onClose() }}
        >
          CONFIRM
        </button>
      </ModalActions>
    </Modal>
  )
}
