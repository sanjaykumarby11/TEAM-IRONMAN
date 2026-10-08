import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../App";
import { PriorityBadge, StatusBadge } from "../components/TaskTable";
import { api } from "../services/api";

export default function TaskDetail() {
  const { id } = useParams();
  const { role, employeeId } = useContext(AppContext);
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const canManage = role === "Manager";
  const canUpdateStatus = canManage || task?.employee_id === employeeId;

  useEffect(() => {
    api.getTask(id).then(setTask).catch((reason) => setError(reason.message));
  }, [id]);

  async function updateStatus(event) {
    setSaving(true);
    setError("");
    try {
      setTask(await api.updateStatus(id, event.target.value));
    } catch (reason) {
      setError(reason.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTask() {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    try {
      await api.deleteTask(id);
      navigate("/tasks");
    } catch (reason) {
      setError(reason.message);
    }
  }

  if (error && !task) return <div className="alert-error">{error}</div>;
  if (!task) return <div className="loading">Loading task…</div>;
  if (role === "Employee" && task.employee_id !== employeeId) {
    return <div className="alert-error">This task is not assigned to the selected employee. <Link to="/my-tasks">View My Tasks</Link></div>;
  }
  return (
    <div className="detail-page">
      <div className="detail-breadcrumb"><Link to="/tasks">All tasks</Link><span>/</span><span>TSK-{String(task.id).padStart(3, "0")}</span></div>
      {error && <div className="alert-error" role="alert">{error}</div>}
      <div className="detail-layout">
        <section className="panel detail-main">
          <div className="detail-topline"><span className="task-id">TASK TSK-{String(task.id).padStart(3, "0")}</span><div className="detail-actions">{canManage && <><Link className="button button-subtle" to={`/tasks/${id}/edit`}>✎ Edit task</Link><button className="button button-danger-ghost" onClick={deleteTask}>Delete</button></>}</div></div>
          <h2 className="detail-title">{task.title}</h2>
          <div className="detail-badges"><PriorityBadge priority={task.priority} /><StatusBadge status={task.status} /></div>
          <div className="detail-description"><h3>Description</h3><p>{task.description || "No description has been added."}</p></div>
          <div className="detail-metadata">
            <div><span>ASSIGNED TO</span><strong><span className="mini-avatar">{task.employee_name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>{task.employee_name}</strong></div>
            <div><span>DEADLINE</span><strong>{new Date(`${task.deadline}T00:00:00`).toLocaleDateString("en", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}</strong></div>
            <div><span>CREATED</span><strong>{new Date(task.created_at).toLocaleString()}</strong></div>
            <div><span>LAST UPDATED</span><strong>{new Date(task.updated_at).toLocaleString()}</strong></div>
          </div>
        </section>
        <aside className="panel status-panel"><div className="panel-heading"><div><h3>Progress</h3><p>Keep the task status current.</p></div></div>
          {canUpdateStatus ? <label className="form-field"><span>Current status</span><select value={task.status} disabled={saving} onChange={updateStatus}><option>Pending</option><option>In Progress</option><option>Completed</option><option>Blocked</option></select></label> : <StatusBadge status={task.status} />}
          {saving && <span className="save-hint">Saving status…</span>}
          {!canUpdateStatus && <p className="permission-note">Only the assigned employee can update this task.</p>}
        </aside>
      </div>
    </div>
  );
}
