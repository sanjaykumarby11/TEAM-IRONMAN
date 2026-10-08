import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, NavLink, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { api } from "./services/api";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import TaskForm from "./pages/TaskForm";
import TaskDetail from "./pages/TaskDetail";
import Employees from "./pages/Employees";

export const AppContext = createContext(null);

const links = [
  { to: "/dashboard", label: "Dashboard", icon: "▦" },
  { to: "/my-tasks", label: "My Tasks", icon: "✓" },
  { to: "/tasks", label: "All Tasks", icon: "☷" },
  { to: "/tasks/create", label: "Create Task", icon: "+" },
  { to: "/employees", label: "Employees", icon: "♙" },
];

function Layout() {
  const { role, setRole, employees, employeeId, setEmployeeId } =
    useContext(AppContext);
  const location = useLocation();
  const pageTitle = location.pathname.startsWith("/tasks/create")
    ? "Create task"
    : location.pathname.includes("/edit")
      ? "Edit task"
      : location.pathname.startsWith("/tasks/")
        ? "Task details"
        : location.pathname === "/employees"
          ? "Employees"
          : location.pathname === "/my-tasks"
            ? "My tasks"
            : location.pathname === "/tasks"
              ? "All tasks"
              : "Overview";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink className="brand" to="/dashboard">
          <span className="brand-mark">T</span>
          <span>taskspace<small>TEAM WORKSPACE</small></span>
        </NavLink>
        <div className="nav-label">WORKSPACE</div>
        <nav className="nav-list">
          {links.filter((link) => role === "Manager" || !["/tasks/create", "/employees"].includes(link.to)).map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/tasks"}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-dot" />
          <div><strong>Workspace</strong><small>Employee operations</small></div>
        </div>
        <div className="sidebar-footer">Simple work. Clear progress.</div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div>
            <div className="breadcrumb">Workspace <span>/</span> {pageTitle}</div>
            <h1>{pageTitle}</h1>
          </div>
          <div className="topbar-controls">
            <label className="role-picker">
              <span>View as</span>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                aria-label="Select role"
              >
                <option value="Manager">Manager / Admin</option>
                <option value="Employee">Employee</option>
              </select>
            </label>
            {role === "Employee" && (
              <label className="employee-picker">
                <span>Employee</span>
                <select
                  value={employeeId || ""}
                  onChange={(event) => setEmployeeId(Number(event.target.value))}
                  aria-label="Select employee"
                >
                  {employees.filter((employee) => employee.role === "Employee").map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.name}</option>
                  ))}
                </select>
              </label>
            )}
            <div className="avatar">{role === "Manager" ? "AR" : "EM"}</div>
          </div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [role, setRole] = useState("Manager");
  const [employeeId, setEmployeeId] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    api.getEmployees()
      .then((items) => {
        setEmployees(items);
        const firstEmployee = items.find((employee) => employee.role === "Employee");
        if (firstEmployee) setEmployeeId(firstEmployee.id);
      })
      .catch((error) => setLoadError(error.message));
  }, []);

  return (
    <AppContext.Provider value={{ employees, role, setRole, employeeId, setEmployeeId }}>
      {loadError && <div className="global-error" role="alert">{loadError}</div>}
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/my-tasks" element={<Tasks mine />} />
          <Route path="/tasks/create" element={<TaskForm />} />
          <Route path="/tasks/:id/edit" element={<TaskForm />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </AppContext.Provider>
  );
}
