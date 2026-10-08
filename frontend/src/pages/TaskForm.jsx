import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../App";
import { api } from "../services/api";

const blankTask = { title: "", description: "", employee_id: "", priority: "Medium", deadline: "", status: "Pending" };

export default function TaskForm() {
  const { id } = useParams();
  const { employees, role } = useContext(AppContext);
  const navigate = useNavigate();
  const [form, setForm] = useState(blankTask);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(id));
  const employeeOptions = employees.filter((employee) => employee.role === "Employee");

  useEffect(() => {
    if (!id) return;
    api.getTask(id)
      .then((task) => setForm({
        title: task.title,
        description: task.description,
        employee_id: String(task.employee_id),
        priority: task.priority,
        deadline: task.deadline,
        status: task.status,
      }))
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (role !== "Manager") return <div className="alert-error">Only a manager or admin can {id ? "edit" : "create"} tasks. <Link to="/my-tasks">Go to My Tasks</Link></div>;
  if (loading) return <div className="loading">Loading task…</div>;

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!form.title.trim()) return setError("Please enter a task title.");
    if (!form.employee_id) return setError("Please assign this task to an employee.");
    if (!form.deadline || Number.isNaN(Date.parse(form.deadline))) return setError("Please choose a valid deadline.");
    const payload = { ...form, title: form.title.trim(), employee_id: Number(form.employee_id) };
    try {
      const task = id ? await api.updateTask(id, payload) : await api.createTask(payload);
      navigate(`/tasks/${task.id}`);
    } catch (reason) {
      setError(reason.message);
    }
  }

  return (
    <div className="form-page">
      <div className="page-intro-row"><div><div className="eyebrow">TASK DETAILS</div><h2>{id ? "Edit task" : "Create a task"}</h2><p>{id ? "Make changes to the task and save your updates." : "Add the details below to assign work to a teammate."}</p></div><Link to="/tasks" className="button button-subtle">Cancel</Link></div>
      {error && <div className="alert-error" role="alert">{error}</div>}
      <form className="panel task-form" onSubmit={submit}>
        <div className="form-section-heading"><span className="section-number">01</span><div><h3>Task information</h3><p>Describe the work clearly so everyone knows what to do.</p></div></div>
        <label className="form-field"><span>Task title <b>*</b></span><input name="title" maxLength="150" placeholder="e.g. Prepare monthly team report" value={form.title} onChange={updateField} required /><small>Keep the title short and clear.</small></label>
        <label className="form-field"><span>Description</span><textarea name="description" maxLength="5000" placeholder="Add context, requirements, or useful links…" rows="5" value={form.description} onChange={updateField} /></label>
        <div className="form-grid">
          <label className="form-field"><span>Assign employee <b>*</b></span><select name="employee_id" value={form.employee_id} onChange={updateField} required><option value="">Select an employee</option>{employeeOptions.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label>
          <label className="form-field"><span>Priority <b>*</b></span><select name="priority" value={form.priority} onChange={updateField}><option>Low</option><option>Medium</option><option>High</option></select></label>
          <label className="form-field"><span>Deadline <b>*</b></span><input type="date" name="deadline" value={form.deadline} onChange={updateField} required /></label>
          {id && <label className="form-field"><span>Status</span><select name="status" value={form.status} onChange={updateField}><option>Pending</option><option>In Progress</option><option>Completed</option><option>Blocked</option></select></label>}
        </div>
        <div className="form-actions"><span><b>*</b> Required fields</span><div><Link className="button button-subtle" to="/tasks">Cancel</Link><button className="button button-primary" type="submit">{id ? "Save changes" : "Create task"}</button></div></div>
      </form>
    </div>
  );
}
