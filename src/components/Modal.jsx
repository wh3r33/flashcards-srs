export default function Modal({ title = "Dialog", icon = "M", children, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <section className="window modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="title-bar">
          <span className="title-left"><span className="program-icon">{icon}</span><span>{title}</span></span>
          <span className="window-controls" aria-hidden="true"><b></b><b></b><b></b></span>
        </div>
        <div className="window-body">{children}</div>
      </section>
    </div>
  );
}
