export default function StatsCard({ label, value, accent = 'teal' }) {
  return (
    <div className={`card card-accent card-accent-${accent}`}>
      <div className="card-label">{label}</div>
      <div className="card-value">{value}</div>
    </div>
  );
}