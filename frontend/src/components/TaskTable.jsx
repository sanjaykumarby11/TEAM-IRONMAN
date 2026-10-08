import { Link } from "react-router-dom";

export function StatusBadge({ status }) {
  return <span className={`badge status-${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span>;
}

export function PriorityBadge({ priority }) {
  return <span className={`badge priority-${priority.toLowerCase()}`}><i />{priority}</span>;
}

export default function TaskTable({ tasks, canManage = true, onDelete }) {
  if (!tasks.length) {
    return <div className="empty-state"><div className="empty-icon">☷</div><strong>No tasks found</strong><span>Try changing your filters or create a new task.</span></div>;
  }
  return (
    <div className="table-wrap">
      <table className="task-table">
        <thead><tr><th>TASK</th><th>ASSIGNED TO</th><th>PRIORITY</th><th>DEADLINE</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td><Link className="task-title-link" to={`/tasks/${task.id}`}><span className="task-id">TSK-{String(task.id).padStart(3, "0")}</span><strong>{task.title}</strong></Link></td>
              <td><span className="person-cell"><span className="mini-avatar">{task.employee_name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>{task.employee_name}</span></td>
              <td><PriorityBadge priority={task.priority} /></td>
              <td className={task.deadline < new Date().toISOString().slice(0, 10) && task.status !== "Completed" ? "overdue-date" : ""}>{new Date(`${task.deadline}T00:00:00`).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</td>
              <td><StatusBadge status={task.status} /></td>
              <td>
                <div className="row-actions">
                  <Link className="icon-action" title="View task" aria-label="View task" to={`/tasks/${task.id}`}>↗</Link>
                  {canManage && <Link className="icon-action" title="Edit task" aria-label="Edit task" to={`/tasks/${task.id}/edit`}>✎</Link>}
                  {canManage && onDelete && <button className="icon-action danger-action" title="Delete task" aria-label="Delete task" onClick={() => onDelete(task)}>×</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
