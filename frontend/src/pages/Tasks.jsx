import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../App";
import TaskTable from "../components/TaskTable";
import { api } from "../services/api";

export default function Tasks({ mine = false }) {
  const { role, employeeId, employees } = useContext(AppContext);
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const canManage = role === "Manager" && !mine;

  useEffect(() => {
    api.getTasks().then(setTasks).catch((reason) => setError(reason.message));
  }, [refresh]);

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const employeeMatches = mine || role === "Employee"
      ? task.employee_id === employeeId
      : !filterEmployee || String(task.employee_id) === filterEmployee;
    const deadlineMatches = !deadline || (deadline === "overdue"
      ? task.deadline < new Date().toISOString().slice(0, 10) && task.status !== "Completed"
      : deadline === "upcoming"
        ? task.deadline >= new Date().toISOString().slice(0, 10) && task.status !== "Completed"
        : task.deadline === deadline);
    return employeeMatches
      && task.title.toLowerCase().includes(search.toLowerCase())
      && (!priority || task.priority === priority)
      && (!status || task.status === status)
      && deadlineMatches;
  }), [tasks, search, filterEmployee, priority, status, deadline, mine, role, employeeId]);

  async function handleDelete(task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    try {
      await api.deleteTask(task.id);
      setRefresh((value) => value + 1);
    } catch (reason) {
      setError(reason.message);
    }
  }

  return (
    <div className="tasks-page">
      <div className="page-intro-row"><div><div className="eyebrow">{mine ? "PERSONAL WORKSPACE" : "TEAM WORKSPACE"}</div><h2>{mine ? "Tasks assigned to you" : "All tasks"}</h2><p>{mine ? "Update your progress and keep your manager in the loop." : "Search, filter, and keep all team work organized."}</p></div>{canManage && <Link className="button button-primary" to="/tasks/create">＋ Create task</Link>}</div>
      {error && <div className="alert-error" role="alert">{error}<button onClick={() => setError("")}>×</button></div>}
      <section className="panel task-list-panel">
        <div className="filter-toolbar">
          <label className="search-field"><span>⌕</span><input aria-label="Search task title" placeholder="Search task title…" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          {!mine && <select aria-label="Filter by employee" value={filterEmployee} onChange={(event) => setFilterEmployee(event.target.value)}><option value="">All employees</option>{employees.map((employee) => <option value={employee.id} key={employee.id}>{employee.name}</option>)}</select>}
          <select aria-label="Filter by priority" value={priority} onChange={(event) => setPriority(event.target.value)}><option value="">All priorities</option><option>High</option><option>Medium</option><option>Low</option></select>
          <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option>Pending</option><option>In Progress</option><option>Completed</option><option>Blocked</option></select>
          <select aria-label="Filter by deadline" value={deadline} onChange={(event) => setDeadline(event.target.value)}><option value="">Any deadline</option><option value="upcoming">Upcoming</option><option value="overdue">Overdue</option></select>
        </div>
        <div className="list-caption"><span><strong>{visibleTasks.length}</strong> tasks</span><span>Updated in real time</span></div>
        <TaskTable tasks={visibleTasks} canManage={canManage} onDelete={canManage ? handleDelete : undefined} />
      </section>
    </div>
  );
}
