import './Dashboard.css';

function Dashboard({
  todos,
  filterSearch = '',
  filterDateFrom = '',
  filterDateTo = '',
  filterCompleted = '',
  onFilterSearchChange,
  onFilterDateFromChange,
  onFilterDateToChange,
  onFilterCompletedChange,
  onApplyFilters,
}) {
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

      <div className="dashboard-filters">
        <label className="dashboard-filter-label">
          <span className="dashboard-filter-name">Search</span>
          <input
            type="search"
            placeholder="Title or description..."
            value={filterSearch}
            onChange={(e) => onFilterSearchChange?.(e.target.value)}
            className="dashboard-filter-input"
          />
        </label>
        <label className="dashboard-filter-label">
          <span className="dashboard-filter-name">From date</span>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => onFilterDateFromChange?.(e.target.value)}
            className="dashboard-filter-input"
          />
        </label>
        <label className="dashboard-filter-label">
          <span className="dashboard-filter-name">To date</span>
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => onFilterDateToChange?.(e.target.value)}
            className="dashboard-filter-input"
          />
        </label>
        <label className="dashboard-filter-label">
          <span className="dashboard-filter-name">Status</span>
          <select
            value={filterCompleted}
            onChange={(e) => onFilterCompletedChange?.(e.target.value)}
            className="dashboard-filter-select"
          >
            <option value="">All</option>
            <option value="0">Pending</option>
            <option value="1">Completed</option>
          </select>
        </label>
        <button
          type="button"
          className="btn btn-primary dashboard-filter-apply"
          onClick={() => onApplyFilters?.({
            search: filterSearch,
            date_from: filterDateFrom,
            date_to: filterDateTo,
            completed: filterCompleted,
          })}
        >
          Apply filters
        </button>
      </div>

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
