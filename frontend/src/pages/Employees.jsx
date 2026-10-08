import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api.getEmployees().then(setEmployees).catch((reason) => setError(reason.message));
  }, []);
  return (
    <div className="employees-page">
      <div className="page-intro-row"><div><div className="eyebrow">PEOPLE DIRECTORY</div><h2>Employees</h2><p>Team members available for task assignment.</p></div><span className="employee-count">{employees.length} team members</span></div>
      {error && <div className="alert-error">{error}</div>}
      <section className="employee-grid">
        {employees.map((employee, index) => (
          <article className="panel employee-card" key={employee.id}>
            <div className={`employee-avatar avatar-tone-${index % 5}`}>{employee.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
            <div className="employee-info"><h3>{employee.name}</h3><span>{employee.role === "Manager" ? "Manager / Admin" : "Employee"}</span><a href={`mailto:${employee.email}`}>{employee.email}</a></div>
            <span className={`role-tag ${employee.role === "Manager" ? "role-manager" : ""}`}>{employee.role}</span>
          </article>
        ))}
      </section>
    </div>
  );
}
