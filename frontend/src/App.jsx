import { useEffect, useEffectEvent, useState } from 'react';
import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { BriefcaseBusiness, CalendarDays, Check, CheckSquare, CircleUserRound, ClipboardList, Download, LayoutDashboard, LogOut, Plus, Search, ShieldCheck, Users, X } from 'lucide-react';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'ironman.session';
const TODAY = new Date().toISOString().slice(0, 10);

async function api(path, token, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || 'The request could not be completed.');
  return body;
}

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

function useLoad(loader, dependencies) {
  const [result, setResult] = useState({ value: null, error: '' });
  const [refreshKey, setRefreshKey] = useState(0);
  const load = useEffectEvent(loader);
  const dependencyKey = JSON.stringify(dependencies);
  useEffect(() => {
    let active = true;
    load().then(value => { if (active) setResult({ value, error: '' }); }).catch(reason => { if (active) setResult({ value: null, error: reason.message }); });
    return () => { active = false; };
  }, [dependencyKey, refreshKey]);
  return { ...result, refresh: () => setRefreshKey(current => current + 1) };
}

function Message({ children, tone = 'error' }) {
  if (!children) return null;
  return <div className={`message ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>;
}

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const session = await api('/login', null, { method: 'POST', body: JSON.stringify({ username, password }) });
      onLogin(session.user, session.access_token);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="brand-mark"><BriefcaseBusiness size={22} /></div>
        <p className="eyebrow">TEAM IRONMAN / PEOPLE OPERATIONS</p>
        <h1>Work, in good order.</h1>
        <p className="login-copy">Sign in to manage people, leave, and team work.</p>
        <Message>{error}</Message>
        <form onSubmit={submit}>
          <label className="field">Username<input autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} required /></label>
          <label className="field">Password<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></label>
          <button className="button primary full" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <p className="demo-note">Demo access: <strong>admin</strong>, <strong>sam</strong>, or <strong>alex</strong> / <strong>password</strong></p>
      </section>
      <aside className="login-aside"><span>PEOPLE</span><span>LEAVE</span><span>DELIVERY</span><div className="aside-note">A clear view of the work and the people doing it.</div></aside>
    </main>
  );
}

function Sidebar({ user, onLogout }) {
  const manager = user.role !== 'employee';
  const links = manager
    ? [
      ['/dashboard', LayoutDashboard, 'Overview'], ['/tasks', CheckSquare, 'Tasks'], ['/employees', Users, 'Employees'],
      ['/leaves', CalendarDays, 'Leave review'], ['/reports', ClipboardList, 'Reports'], ['/profile', CircleUserRound, 'My profile'],
    ]
    : [
      ['/dashboard', LayoutDashboard, 'Overview'], ['/tasks', CheckSquare, 'My tasks'], ['/leaves', CalendarDays, 'My leave'],
      ['/profile', CircleUserRound, 'My profile'],
    ];
  return (
    <aside className="sidebar">
      <a className="sidebar-logo" href="/dashboard"><span className="brand-mark"><BriefcaseBusiness size={19} /></span><span>Ironman<span className="logo-light"> / People</span></span></a>
      <div className="nav-caption">WORKSPACE</div>
      <nav className="nav-links">
        {links.map(([path, Icon, label]) => <NavLink key={path} to={path} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={18} /><span>{label}</span></NavLink>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="security-note"><ShieldCheck size={16} /><span>Signed in as {user.role}</span></div>
        <div className="user-mini"><span className="avatar">{initials(user.name)}</span><div className="user-mini-info"><strong>{user.name}</strong><small>@{user.username}</small></div><button className="icon-button" title="Sign out" aria-label="Sign out" onClick={onLogout}><LogOut size={17} /></button></div>
      </div>
    </aside>
  );
}

function PageTitle({ eyebrow, title, detail, action }) {
  return <header className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{detail && <p className="page-detail">{detail}</p>}</div>{action}</header>;
}

function Stat({ label, value, note, icon: Icon }) {
  return <section className="stat-card"><div><p className="stat-label">{label}</p><strong className="stat-value">{value}</strong><p className="stat-note">{note}</p></div><span className="stat-icon"><Icon size={20} /></span></section>;
}

function Dashboard({ user, token }) {
  const loader = async () => {
    const [tasks, leaves] = await Promise.all([api('/tasks', token), api('/leaves', token)]);
    const balance = user.role === 'employee' ? await api(`/leaves/balance/${user.id}`, token) : null;
    const users = user.role === 'employee' ? [] : await api('/users', token);
    return { tasks, leaves, balance, users };
  };
  const { value, error } = useLoad(loader, [token, user.id, user.role]);
  const openTasks = value?.tasks.filter(task => task.status !== 'done').length ?? '—';
  const pendingLeaves = value?.leaves.filter(leave => leave.status === 'pending').length ?? '—';
  return <div className="page-container">
    <PageTitle eyebrow="WORKSPACE / OVERVIEW" title={`Good day, ${user.name.split(' ')[0]}.`} detail="A live snapshot of your team and current work." />
    <Message>{error}</Message>
    {value && <div className="stats-grid">
      <Stat label={user.role === 'employee' ? 'My open tasks' : 'Open tasks'} value={openTasks} note="Not yet completed" icon={CheckSquare} />
      <Stat label={user.role === 'employee' ? 'Leave remaining' : 'Pending leave'} value={user.role === 'employee' ? `${value.balance.remaining} days` : pendingLeaves} note={user.role === 'employee' ? `${value.balance.used} approved days used` : 'Requests awaiting review'} icon={CalendarDays} />
      {user.role !== 'employee' && <Stat label="Employees" value={value.users.length} note="In the directory" icon={Users} />}
      <Stat label="All assignments" value={value.tasks.length} note="Visible tasks" icon={ClipboardList} />
    </div>}
    <section className="content-section"><div className="section-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>{user.role === 'employee' ? 'Your next tasks' : 'Team tasks'}</h2></div></div>
      {value?.tasks.slice(0, 4).map(task => <div className="list-row" key={task.id}><div className="row-main"><strong>{task.title}</strong><span>{task.due_date} · {task.priority} priority</span></div><StatusBadge value={task.status} /></div>)}
      {value && value.tasks.length === 0 && <Empty>No tasks are assigned yet.</Empty>}
    </section>
  </div>;
}

function StatusBadge({ value }) {
  return <span className={`status-badge ${value}`}>{value.replace('-', ' ')}</span>;
}

function Empty({ children }) {
  return <div className="empty-state">{children}</div>;
}

function Employees({ token, user }) {
  const { value: employees, error, refresh } = useLoad(() => api('/users', token), [token]);
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'employee' });
  const [notice, setNotice] = useState('');
  const [problem, setProblem] = useState('');
  const [query, setQuery] = useState('');
  const isAdmin = user.role === 'admin';
  const visible = (employees || []).filter(person => `${person.name} ${person.username} ${person.role}`.toLowerCase().includes(query.toLowerCase()));

  async function createEmployee(event) {
    event.preventDefault();
    setNotice(''); setProblem('');
    try {
      await api('/users', token, { method: 'POST', body: JSON.stringify(form) });
      setForm({ username: '', password: '', name: '', role: 'employee' });
      setNotice('Employee profile created.'); refresh();
    } catch (reason) { setProblem(reason.message); }
  }

  async function updateEmployee(person, changes) {
    setNotice(''); setProblem('');
    try {
      await api(`/users/${person.id}`, token, { method: 'PUT', body: JSON.stringify(changes) });
      setNotice(`${person.name}'s profile was updated.`); refresh();
    } catch (reason) { setProblem(reason.message); }
  }

  return <div className="page-container">
    <PageTitle eyebrow="PEOPLE / DIRECTORY" title="Employees" detail="Maintain employee accounts and role assignments." />
    <Message>{error || problem}</Message><Message tone="success">{notice}</Message>
    {isAdmin && <section className="content-section"><div className="section-heading"><div><p className="eyebrow">NEW RECORD</p><h2>Add an employee</h2></div></div>
      <form className="form-grid" onSubmit={createEmployee}>
        <label className="field">Full name<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required /></label>
        <label className="field">Username<input value={form.username} onChange={event => setForm({ ...form, username: event.target.value })} minLength="2" required /></label>
        <label className="field">Temporary password<input type="password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} minLength="8" required /></label>
        <label className="field">Role<select value={form.role} onChange={event => setForm({ ...form, role: event.target.value })}><option value="employee">Employee</option><option value="manager">Manager</option><option value="admin">Administrator</option></select></label>
        <button className="button primary"><Plus size={16} /> Add employee</button>
      </form>
    </section>}
    <section className="content-section"><div className="section-heading"><div><p className="eyebrow">DIRECTORY</p><h2>{visible.length} people</h2></div><label className="search-box"><Search size={16} /><input placeholder="Search employees" value={query} onChange={event => setQuery(event.target.value)} /></label></div>
      <div className="table-wrap"><table><thead><tr><th>Employee</th><th>Username</th><th>Role</th><th>Profile</th></tr></thead><tbody>
        {visible.map(person => <EmployeeRow key={person.id} person={person} canEdit={isAdmin} onSave={updateEmployee} />)}
      </tbody></table></div>
      {employees && visible.length === 0 && <Empty>No employees match that search.</Empty>}
    </section>
  </div>;
}

function EmployeeRow({ person, canEdit, onSave }) {
  const [name, setName] = useState(person.name);
  const [role, setRole] = useState(person.role);
  return <tr><td><span className="person-cell"><span className="avatar small">{initials(person.name)}</span><strong>{person.name}</strong></span></td><td>@{person.username}</td><td>{canEdit ? <select className="compact-select" value={role} onChange={event => setRole(event.target.value)}><option value="employee">Employee</option><option value="manager">Manager</option><option value="admin">Administrator</option></select> : <span className="role-label">{person.role}</span>}</td><td>{canEdit ? <div className="inline-edit"><input aria-label={`Name for ${person.username}`} value={name} onChange={event => setName(event.target.value)} /><button className="icon-button accent" title="Save profile" aria-label={`Save ${person.username}`} onClick={() => onSave(person, { name, role })}><Check size={17} /></button></div> : <span className="muted">View only</span>}</td></tr>;
}

function Tasks({ token, user }) {
  const isManager = user.role !== 'employee';
  const load = async () => {
    const [tasks, employees] = await Promise.all([api('/tasks', token), isManager ? api('/users', token) : Promise.resolve([])]);
    return { tasks, employees };
  };
  const { value, error, refresh } = useLoad(load, [token, isManager]);
  const [form, setForm] = useState({ title: '', description: '', assignee_id: '', priority: 'medium', due_date: '', status: 'todo' });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [problem, setProblem] = useState('');
  const [notice, setNotice] = useState('');
  const tasks = (value?.tasks || []).filter(task => (status === 'all' || task.status === status) && (priority === 'all' || task.priority === priority) && `${task.title} ${task.description}`.toLowerCase().includes(search.toLowerCase()));

  async function createTask(event) {
    event.preventDefault(); setProblem(''); setNotice('');
    try {
      await api('/tasks', token, { method: 'POST', body: JSON.stringify({ ...form, assignee_id: Number(form.assignee_id) }) });
      setForm({ title: '', description: '', assignee_id: '', priority: 'medium', due_date: '', status: 'todo' });
      setNotice('Task assigned.'); refresh();
    } catch (reason) { setProblem(reason.message); }
  }

  async function updateStatus(task, nextStatus) {
    setProblem('');
    try { await api(`/tasks/${task.id}`, token, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) }); refresh(); }
    catch (reason) { setProblem(reason.message); }
  }

  const employeeNames = Object.fromEntries((value?.employees || []).map(person => [person.id, person.name]));
  return <div className="page-container">
    <PageTitle eyebrow="DELIVERY / TASKS" title={isManager ? 'Task management' : 'My tasks'} detail="Assign, track, and move work through the team." />
    <Message>{error || problem}</Message><Message tone="success">{notice}</Message>
    {isManager && <section className="content-section"><div className="section-heading"><div><p className="eyebrow">ASSIGN WORK</p><h2>Create a task</h2></div></div>
      <form className="form-grid task-form" onSubmit={createTask}>
        <label className="field">Task title<input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} required /></label>
        <label className="field">Assignee<select value={form.assignee_id} onChange={event => setForm({ ...form, assignee_id: event.target.value })} required><option value="">Select employee</option>{value?.employees.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
        <label className="field">Due date<input type="date" value={form.due_date} onChange={event => setForm({ ...form, due_date: event.target.value })} required /></label>
        <label className="field">Priority<select value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value })}><option>low</option><option>medium</option><option>high</option></select></label>
        <label className="field span-two">Description<textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} rows="2" /></label>
        <button className="button primary"><Plus size={16} /> Create task</button>
      </form>
    </section>}
    <section className="content-section"><div className="section-heading"><div><p className="eyebrow">TRACKING</p><h2>{tasks.length} tasks</h2></div></div>
      <div className="filters"><label className="search-box"><Search size={16} /><input placeholder="Search tasks" value={search} onChange={event => setSearch(event.target.value)} /></label><select aria-label="Filter by status" value={status} onChange={event => setStatus(event.target.value)}><option value="all">All statuses</option><option value="todo">To do</option><option value="in-progress">In progress</option><option value="review">Review</option><option value="done">Done</option></select><select aria-label="Filter by priority" value={priority} onChange={event => setPriority(event.target.value)}><option value="all">All priorities</option><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option></select></div>
      <div className="table-wrap"><table><thead><tr><th>Task</th><th>Assignee</th><th>Due date</th><th>Priority</th><th>Status</th></tr></thead><tbody>
        {tasks.map(task => <tr key={task.id}><td><strong>{task.title}</strong><small className="table-subtitle">{task.description}</small></td><td>{employeeNames[task.assignee_id] || `Employee ${task.assignee_id}`}</td><td>{task.due_date}</td><td><StatusBadge value={task.priority} /></td><td><select className="compact-select" value={task.status} aria-label={`Status for ${task.title}`} onChange={event => updateStatus(task, event.target.value)}><option value="todo">To do</option><option value="in-progress">In progress</option><option value="review">Review</option><option value="done">Done</option></select></td></tr>)}
      </tbody></table></div>
      {value && tasks.length === 0 && <Empty>No tasks match these filters.</Empty>}
    </section>
  </div>;
}

function Leaves({ token, user }) {
  const isManager = user.role !== 'employee';
  const load = async () => {
    const [leaves, employees, balance] = await Promise.all([
      api('/leaves', token), isManager ? api('/users', token) : Promise.resolve([]),
      isManager ? Promise.resolve(null) : api(`/leaves/balance/${user.id}`, token),
    ]);
    return { leaves, employees, balance };
  };
  const { value, error, refresh } = useLoad(load, [token, user.id, isManager]);
  const [form, setForm] = useState({ start_date: '', end_date: '', reason: '' });
  const [problem, setProblem] = useState('');
  const [notice, setNotice] = useState('');
  const employeeNames = Object.fromEntries((value?.employees || []).map(person => [person.id, person.name]));

  async function requestLeave(event) {
    event.preventDefault(); setProblem(''); setNotice('');
    try {
      await api('/leaves', token, { method: 'POST', body: JSON.stringify(form) });
      setForm({ start_date: '', end_date: '', reason: '' }); setNotice('Leave request submitted for review.'); refresh();
    } catch (reason) { setProblem(reason.message); }
  }

  async function decide(leave, nextStatus) {
    setProblem(''); setNotice('');
    try {
      await api(`/leaves/${leave.id}/status`, token, { method: 'PUT', body: JSON.stringify({ status: nextStatus }) });
      setNotice(`Request ${nextStatus}.`); refresh();
    } catch (reason) { setProblem(reason.message); }
  }

  return <div className="page-container">
    <PageTitle eyebrow={isManager ? 'PEOPLE / LEAVE' : 'MY TIME / LEAVE'} title={isManager ? 'Leave review' : 'My leave'} detail={isManager ? 'Review requests and keep the team calendar accurate.' : 'Request time away and track each decision.'} />
    <Message>{error || problem}</Message><Message tone="success">{notice}</Message>
    {!isManager && value && <div className="balance-strip"><div><span>Available allowance</span><strong>{value.balance.remaining} days</strong></div><div><span>Approved</span><strong>{value.balance.used} days</strong></div><div><span>Pending</span><strong>{value.balance.pending} days</strong></div><small>Requests reserve days while pending. Calendar days are counted inclusively.</small></div>}
    {!isManager && <section className="content-section"><div className="section-heading"><div><p className="eyebrow">NEW REQUEST</p><h2>Request leave</h2></div></div>
      <form className="form-grid leave-form" onSubmit={requestLeave}><label className="field">Start date<input type="date" min={TODAY} value={form.start_date} onChange={event => setForm({ ...form, start_date: event.target.value })} required /></label><label className="field">End date<input type="date" min={form.start_date || TODAY} value={form.end_date} onChange={event => setForm({ ...form, end_date: event.target.value })} required /></label><label className="field span-two">Reason<textarea rows="2" minLength="2" value={form.reason} onChange={event => setForm({ ...form, reason: event.target.value })} required /></label><button className="button primary"><Plus size={16} /> Submit request</button></form>
    </section>}
    <section className="content-section"><div className="section-heading"><div><p className="eyebrow">{isManager ? 'REQUEST QUEUE' : 'HISTORY'}</p><h2>{isManager ? 'Requests' : 'Request history'}</h2></div></div>
      <div className="table-wrap"><table><thead><tr>{isManager && <th>Employee</th>}<th>Dates</th><th>Reason</th><th>Days</th><th>Status</th>{isManager && <th>Review</th>}</tr></thead><tbody>
        {value?.leaves.map(leave => <tr key={leave.id}>{isManager && <td>{employeeNames[leave.employee_id] || `Employee ${leave.employee_id}`}</td>}<td>{leave.start_date} – {leave.end_date}</td><td>{leave.reason}</td><td>{Math.round((new Date(`${leave.end_date}T00:00:00`) - new Date(`${leave.start_date}T00:00:00`)) / 86400000) + 1}</td><td><StatusBadge value={leave.status} /></td>{isManager && <td>{leave.status === 'pending' ? <div className="actions"><button className="icon-button approve" title="Approve request" aria-label="Approve request" onClick={() => decide(leave, 'approved')}><Check size={17} /></button><button className="icon-button reject" title="Reject request" aria-label="Reject request" onClick={() => decide(leave, 'rejected')}><X size={17} /></button></div> : <span className="muted">Reviewed</span>}</td>}</tr>)}
      </tbody></table></div>{value && value.leaves.length === 0 && <Empty>No leave requests to show.</Empty>}
    </section>
  </div>;
}

function downloadCsv(filename, rows) {
  const csv = rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
}

function Reports({ token }) {
  const load = async () => Promise.all([api('/reports/leaves', token), api('/reports/tasks', token)]);
  const { value, error } = useLoad(load, [token]);
  const [report, setReport] = useState('leaves');
  const leaveReport = value?.[0];
  const taskReport = value?.[1];
  const exportLeave = () => leaveReport && downloadCsv('leave-report.csv', [['Employee', 'Pending requests', 'Approved requests', 'Rejected requests', 'Approved days'], ...leaveReport.by_employee.map(item => [item.employee_name, item.pending, item.approved, item.rejected, item.approved_days])]);
  const exportTasks = () => taskReport && downloadCsv('task-report.csv', [['Assignee', 'Total tasks', 'Completed'], ...taskReport.by_assignee.map(item => [item.assignee_name, item.total, item.done])]);
  return <div className="page-container">
    <PageTitle eyebrow="INSIGHTS / REPORTS" title="Reports" detail="Summaries are generated from the current employee, leave, and task records." />
    <Message>{error}</Message>
    <div className="report-tabs" role="tablist"><button role="tab" aria-selected={report === 'leaves'} className={report === 'leaves' ? 'selected' : ''} onClick={() => setReport('leaves')}>Leave summary</button><button role="tab" aria-selected={report === 'tasks'} className={report === 'tasks' ? 'selected' : ''} onClick={() => setReport('tasks')}>Task progress</button></div>
    {report === 'leaves' && leaveReport && <section className="content-section report-section"><div className="section-heading"><div><p className="eyebrow">LEAVE / {leaveReport.total_requests} REQUESTS</p><h2>Leave by employee</h2></div><button className="button secondary" onClick={exportLeave}><Download size={16} /> Export CSV</button></div><div className="table-wrap"><table><thead><tr><th>Employee</th><th>Pending</th><th>Approved</th><th>Rejected</th><th>Approved days</th></tr></thead><tbody>{leaveReport.by_employee.map(item => <tr key={item.employee_id}><td><strong>{item.employee_name}</strong></td><td>{item.pending}</td><td>{item.approved}</td><td>{item.rejected}</td><td>{item.approved_days}</td></tr>)}</tbody></table></div>{leaveReport.by_employee.length === 0 && <Empty>No leave data is available yet.</Empty>}</section>}
    {report === 'tasks' && taskReport && <section className="content-section report-section"><div className="section-heading"><div><p className="eyebrow">TASKS / {taskReport.total_tasks} ASSIGNMENTS</p><h2>Progress by assignee</h2></div><button className="button secondary" onClick={exportTasks}><Download size={16} /> Export CSV</button></div><div className="status-summary">{Object.entries(taskReport.by_status).map(([status, count]) => <div key={status}><StatusBadge value={status} /><strong>{count}</strong></div>)}</div><div className="table-wrap"><table><thead><tr><th>Assignee</th><th>Total tasks</th><th>Completed</th><th>Completion</th></tr></thead><tbody>{taskReport.by_assignee.map(item => <tr key={item.assignee_id}><td><strong>{item.assignee_name}</strong></td><td>{item.total}</td><td>{item.done}</td><td>{item.total ? `${Math.round(item.done / item.total * 100)}%` : '0%'}</td></tr>)}</tbody></table></div>{taskReport.by_assignee.length === 0 && <Empty>No task data is available yet.</Empty>}</section>}
  </div>;
}

function Profile({ user, token, onUpdate }) {
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState('');
  const [problem, setProblem] = useState('');
  const [notice, setNotice] = useState('');
  async function save(event) {
    event.preventDefault(); setProblem(''); setNotice('');
    const updates = { name };
    if (password) updates.password = password;
    try { const updated = await api(`/users/${user.id}`, token, { method: 'PUT', body: JSON.stringify(updates) }); onUpdate(updated); setPassword(''); setNotice('Profile saved.'); }
    catch (reason) { setProblem(reason.message); }
  }
  return <div className="page-container"><PageTitle eyebrow="ACCOUNT / PROFILE" title="My profile" detail="Update your account details." /><Message>{problem}</Message><Message tone="success">{notice}</Message><section className="content-section profile-section"><span className="avatar large">{initials(user.name)}</span><form className="profile-form" onSubmit={save}><label className="field">Full name<input value={name} onChange={event => setName(event.target.value)} required /></label><label className="field">Username<input value={user.username} disabled /></label><label className="field">New password<input type="password" value={password} onChange={event => setPassword(event.target.value)} minLength="8" placeholder="Leave blank to keep current" /></label><button className="button primary">Save profile</button></form></section></div>;
}

function Workspace({ user, token, onLogout, onUpdate }) {
  return <BrowserRouter><div className="app-container"><Sidebar user={user} onLogout={onLogout} /><main className="main-content"><Routes>
    <Route path="/dashboard" element={<Dashboard user={user} token={token} />} />
    <Route path="/tasks" element={<Tasks user={user} token={token} />} />
    <Route path="/leaves" element={<Leaves user={user} token={token} />} />
    <Route path="/profile" element={<Profile user={user} token={token} onUpdate={onUpdate} />} />
    {user.role !== 'employee' && <><Route path="/employees" element={<Employees user={user} token={token} />} /><Route path="/reports" element={<Reports token={token} />} /></>}
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes></main></div></BrowserRouter>;
}

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [checkingSession, setCheckingSession] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));
  useEffect(() => {
    if (!token) return;
    api('/me', token).then(setUser).catch(() => { localStorage.removeItem(TOKEN_KEY); setToken(null); }).finally(() => setCheckingSession(false));
  }, [token]);
  function login(nextUser, nextToken) { localStorage.setItem(TOKEN_KEY, nextToken); setToken(nextToken); setUser(nextUser); }
  async function logout() {
    try { await api('/logout', token, { method: 'POST' }); } catch { /* Clear local session even if the server is unreachable. */ }
    localStorage.removeItem(TOKEN_KEY); setToken(null); setUser(null);
  }
  if (checkingSession) return <div className="loading-screen">Restoring your session...</div>;
  if (!user || !token) return <Login onLogin={login} />;
  return <Workspace user={user} token={token} onLogout={logout} onUpdate={setUser} />;
}

export default App;
