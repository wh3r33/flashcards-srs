export default function StatCard({ label, value, variant, tone, kicker, caption }) {
  return (
    <article className={`panel stat-panel ${variant || ""} ${tone || ""}`.trim()}>
      <div className="stat-head"><span>{label}</span><span>{kicker}</span></div>
      <div className="stat-body">
        <span className="stat-value">{value}</span>
        <span className="stat-mark" aria-hidden="true"></span>
      </div>
      <p className="muted">{caption}</p>
      <div className="meter" aria-hidden="true"></div>
    </article>
  );
}
