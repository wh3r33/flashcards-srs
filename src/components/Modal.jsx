export default function Modal({ title = "Окно", icon = "О", children, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <span className="program-icon">{icon}</span>
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть окно">Закрыть</button>
        </div>
        <div className="window-body">{children}</div>
      </section>
    </div>
  );
}
