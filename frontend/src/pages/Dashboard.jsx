import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../App";
import { api } from "../services/api";
import TaskTable, { StatusBadge } from "../components/TaskTable";

const cards = [
  ["total", "Total tasks", "stat-blue", "◫"],
  ["pending", "Pending", "stat-amber", "◷"],
  ["in_progress", "In progress", "stat-violet", "↗"],
  ["completed", "Completed", "stat-green", "✓"],
  ["blocked", "Blocked", "stat-red", "!"],
  ["overdue", "Overdue", "stat-orange", "⌛"],
];

export default function Dashboard() {
  const { role, employeeId } = useContext(AppContext);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    setDashboard(null);
    api.getDashboard(role === "Employee" ? employeeId : undefined)
      .then(setDashboard)
      .catch((reason) => setError(reason.message));
  }, [role, employeeId]);
  if (error) return <div className="alert-error">{error}</div>;
  if (!dashboard) return <div className="loading">Loading your workspace…</div>;
  const { stats, recent_tasks: recent, upcoming_deadlines: upcoming } = dashboard;

  return (
    <div className="dashboard-page">
      <section className="welcome-row">
        <div><div className="eyebrow">{role === "Manager" ? "YOUR TEAM AT A GLANCE" : "YOUR WORK AT A GLANCE"}</div><h2>Good work starts with clarity.</h2><p>Keep tasks moving and see what needs attention.</p></div>
        {role === "Manager" && <Link className="button button-primary" to="/tasks/create"><span>＋</span> Create a task</Link>}
      </section>
      <section className="stat-grid">
        {cards.map(([key, label, color, icon]) => (
          <article className="stat-card" key={key}>
            <div className={`stat-icon ${color}`}>{icon}</div>
            <div><span>{label}</span><strong>{stats[key]}</strong></div>
            <div className={`stat-trend ${color}`}>{key === "overdue" ? "Needs attention" : "In workspace"}</div>
          </article>
        ))}
      </section>
      <section className="dashboard-columns">
        <article className="panel recent-panel">
          <div className="panel-heading"><div><h3>Recent tasks</h3><p>Latest updates from your team</p></div><Link to="/tasks" className="text-link">View all tasks <span>→</span></Link></div>
          <TaskTable tasks={recent} canManage={false} />
        </article>
        <article className="panel deadlines-panel">
          <div className="panel-heading"><div><h3>Upcoming deadlines</h3><p>Plan ahead and keep on track</p></div><span className="deadline-count">{upcoming.length} soon</span></div>
          {upcoming.length === 0 ? <div className="compact-empty">No upcoming deadlines.</div> : (
            <div className="deadline-list">
              {upcoming.map((task) => (
                <Link className="deadline-item" to={`/tasks/${task.id}`} key={task.id}>
                  <div className="deadline-date"><strong>{new Date(`${task.deadline}T00:00:00`).getDate()}</strong><span>{new Date(`${task.deadline}T00:00:00`).toLocaleDateString("en", { month: "short" })}</span></div>
                  <div className="deadline-task"><strong>{task.title}</strong><span>{task.employee_name}</span></div>
                  <StatusBadge status={task.status} />
                </Link>
              ))}
            </div>
          )}
          <div className="status-summary">
            <h4>Task status summary</h4>
            {[
              ["Completed", stats.completed, "summary-green"],
              ["In Progress", stats.in_progress, "summary-violet"],
              ["Pending", stats.pending, "summary-amber"],
              ["Blocked", stats.blocked, "summary-red"],
            ].map(([label, count, color]) => (
              <div className="summary-row" key={label}><span>{label}</span><div className="summary-track"><i className={color} style={{ width: `${stats.total ? (count / stats.total) * 100 : 0}%` }} /></div><strong>{count}</strong></div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
