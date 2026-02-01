import './Dashboard.css';

function Dashboard({ todos }) {
  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const pending = total - completed;
  const withDocuments = todos.filter((t) => (t.document_count || 0) > 0).length;
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const stats = [
    { label: 'Total tasks', value: total, className: 'stat-total' },
    { label: 'Completed', value: completed, className: 'stat-done' },
    { label: 'Pending', value: pending, className: 'stat-pending' },
    { label: 'With documents', value: withDocuments, className: 'stat-docs' },
  ];

  return (
    <section className="dashboard" aria-label="Todo overview">
      <h2 className="dashboard-title">Overview</h2>
      <div className="dashboard-stats">
        {stats.map((s) => (
          <div key={s.label} className={`dashboard-stat ${s.className}`}>
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="dashboard-progress">
        <div className="progress-header">
          <span className="progress-label">Completion</span>
          <span className="progress-pct">{completionPct}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${completionPct}%` }}
            role="progressbar"
            aria-valuenow={completionPct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
