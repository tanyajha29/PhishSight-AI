import { useEffect, useState } from 'react';
import api from '../api/client';

export default function UserDashboard() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        setStatus('Loading history…');
        const resp = await api.get('/api/user/history');
        if (!active) return;
        setRows(resp.data?.history || []);
        setStatus('');
      } catch (err) {
        if (!active) return;
        setStatus(err?.response?.data?.error || 'Unable to load history');
      }
    }

    loadHistory();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>User Dashboard</h2>
          <p className="muted">Your recent URL checks</p>
        </div>
        {status && <span className="status-chip">{status}</span>}
      </div>

      <div className="card">
        <div className="card-title">Personal History</div>
        <div className="table">
          <div className="table-row table-head">
            <div>URL</div>
            <div>Verdict</div>
            <div>Probability</div>
            <div>Checked At</div>
          </div>
          {rows.length === 0 && (
            <div className="table-row">
              <div className="muted" style={{ gridColumn: '1 / -1' }}>No history available.</div>
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
    </div>
  );
}