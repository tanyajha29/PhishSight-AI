import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function RiskChart({ data }) {
  return (
    <div className="card">
      <div className="card-title">Risk Distribution</div>
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="legend">
        {data.map((entry) => (
          <div key={entry.name} className="legend-item">
            <span className="legend-dot" style={{ background: entry.color }} />
            <span>{entry.name}</span>
            <span className="legend-value">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}