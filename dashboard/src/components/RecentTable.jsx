export default function RecentTable({ rows }) {
  return (
    <div className="card">
      <div className="card-title">Recent Flagged URLs</div>
      <div className="table">
        <div className="table-row table-head">
          <div>URL</div>
          <div>Verdict</div>
          <div>Probability</div>
          <div>Timestamp</div>
        </div>
        {rows.length === 0 && (
          <div className="table-row">
            <div className="muted" style={{ gridColumn: '1 / -1' }}>No flagged URLs yet.</div>
          </div>
        )}
        {rows.map((row) => (
          <div className="table-row" key={row.id}>
            <div className="mono truncate" title={row.url}>{row.url}</div>
            <div className={`pill ${row.prediction === 'phishing' ? 'pill-danger' : 'pill-ok'}`}>
              {row.prediction}
            </div>
            <div>{row.probability}</div>
            <div>{row.timestamp}</div>
          </div>
        ))}
      </div>
    </div>
  );
}