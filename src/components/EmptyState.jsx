export default function EmptyState({ eyebrow = "Empty", title, children }) {
  return (
    <div className="empty-state">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        <p className="muted">{children}</p>
      </div>
    </div>
  );
}
