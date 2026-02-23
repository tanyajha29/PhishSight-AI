import { useEffect, useState } from 'react';
import api from '../api/client';
import StatsCard from '../components/StatsCard';
import RiskChart from '../components/RiskChart';
import RecentTable from '../components/RecentTable';

const EMPTY_RISK = [
  { name: 'Low', value: 0, color: '#22c55e' },
  { name: 'Medium', value: 0, color: '#f59e0b' },
  { name: 'High', value: 0, color: '#ef4444' }
];

export default function AdminDashboard() {
  const [summary, setSummary] = useState({ total: 0, phishing: 0 });
  const [riskData, setRiskData] = useState(EMPTY_RISK);
  const [recent, setRecent] = useState([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setStatus('Loading metrics…');
        const resp = await api.get('/api/admin/dashboard');
        if (!active) return;

        const data = resp.data || {};
        setSummary({
          total: data.totalUrlsScanned || 0,
          phishing: data.phishingCount || 0
        });
        setRiskData(data.riskDistribution || EMPTY_RISK);
        setRecent(data.recentFlaggedUrls || []);
        setStatus('');
      } catch (err) {
        if (!active) return;
        setStatus(err?.response?.data?.error || 'Unable to load admin metrics');
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Admin Dashboard</h2>
          <p className="muted">Organization-wide phishing telemetry</p>
        </div>
        {status && <span className="status-chip">{status}</span>}
      </div>

      <div className="grid stats-grid">
        <StatsCard label="Total URLs scanned" value={summary.total} accent="teal" />
        <StatsCard label="Phishing detected" value={summary.phishing} accent="rose" />
      </div>

      <div className="grid split-grid">
        <RiskChart data={riskData} />
        <RecentTable rows={recent} />
      </div>
    </div>
  );
}