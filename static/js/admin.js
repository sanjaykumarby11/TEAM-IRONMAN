/* Admin & Manager Directory, Reports & Analytics Module */

let currentEmployees = [];

async function loadEmployeeDirectory() {
    try {
        const res = await apiRequest('/api/employees');
        currentEmployees = res.employees;
        renderEmployeeDirectoryTable();
    } catch (err) {
        console.error("Error loading employee directory:", err);
    }
}

function renderEmployeeDirectoryTable() {
    const tbody = document.getElementById('employee-list-tbody');
    if (!tbody) return;

    if (currentEmployees.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-muted">No employees registered yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = currentEmployees.map(emp => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <img src="${emp.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + emp.email}" class="user-avatar-sm">
                    <div>
                        <strong>${emp.name}</strong>
                        <div style="font-size: 11px;" class="text-muted">${emp.designation}</div>
                    </div>
                </div>
            </td>
            <td>
                <div>${emp.email}</div>
                <small class="text-muted">${emp.phone || 'N/A'}</small>
            </td>
            <td><span class="badge badge-secondary">${emp.department}</span></td>
            <td>
                <select style="padding: 4px 8px; font-size: 12px;" onchange="updateEmployeeRoleStatus(${emp.id}, 'role', this.value)">
                    <option value="employee" ${emp.role === 'employee' ? 'selected' : ''}>Employee</option>
                    <option value="manager" ${emp.role === 'manager' ? 'selected' : ''}>Manager</option>
                    <option value="admin" ${emp.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
            </td>
            <td>
                <select style="padding: 4px 8px; font-size: 12px;" onchange="updateEmployeeRoleStatus(${emp.id}, 'status', this.value)">
                    <option value="active" ${emp.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="inactive" ${emp.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                </select>
            </td>
            <td>
                <small>Annual: ${emp.annual_leave_used || 0}/${emp.annual_leave_allocated || 20}d</small><br>
                <small>Sick: ${emp.sick_leave_used || 0}/${emp.sick_leave_allocated || 10}d</small>
            </td>
            <td>
                <button type="button" class="btn btn-outline btn-sm" onclick="editEmployeeDetailsPrompt(${emp.id})">
                    <i class="fa-solid fa-pen-to-square"></i> Edit
                </button>
            </td>
        </tr>
    `).join('');
}

async function updateEmployeeRoleStatus(empId, field, value) {
    const emp = currentEmployees.find(e => e.id === empId);
    if (!emp) return;

    const newRole = field === 'role' ? value : emp.role;
    const newStatus = field === 'status' ? value : emp.status;

    try {
        await apiRequest(`/api/employees/${empId}`, 'PUT', {
            role: newRole,
            status: newStatus,
            department: emp.department,
            designation: emp.designation
        });
        showToast(`Updated employee ${field} to ${value}`, 'success');
        loadEmployeeDirectory();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function editEmployeeDetailsPrompt(empId) {
    const emp = currentEmployees.find(e => e.id === empId);
    if (!emp) return;

    const newDept = prompt("Enter Department:", emp.department);
    if (!newDept) return;

    const newDesig = prompt("Enter Job Designation:", emp.designation);
    if (!newDesig) return;

    apiRequest(`/api/employees/${empId}`, 'PUT', {
        role: emp.role,
        status: emp.status,
        department: newDept,
        designation: newDesig
    }).then(() => {
        showToast("Employee updated successfully", 'success');
        loadEmployeeDirectory();
    }).catch(err => showToast(err.message, 'error'));
}

function openAddEmployeeModal() {
    openModal('modal-add-employee');
}

async function submitAddEmployeeAdmin(e) {
    e.preventDefault();
    const name = document.getElementById('admin-emp-name').value.trim();
    const email = document.getElementById('admin-emp-email').value.trim();
    const password = document.getElementById('admin-emp-password').value;
    const role = document.getElementById('admin-emp-role').value;
    const department = document.getElementById('admin-emp-dept').value;
    const designation = document.getElementById('admin-emp-designation').value.trim();

    try {
        await apiRequest('/api/employees', 'POST', {
            name, email, password, role, department, designation
        });
        showToast(`Employee ${name} added successfully!`, 'success');
        closeModal('modal-add-employee');
        loadEmployeeDirectory();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

/* REPORTS & ANALYTICS */

async function loadAnalyticsDashboard() {
    try {
        const res = await apiRequest('/api/analytics/dashboard');
        renderAnalyticsUI(res.summary);
    } catch (err) {
        console.error("Error loading analytics summary:", err);
    }
}

function renderAnalyticsUI(summary) {
    if (!summary) return;

    // Render Department Breakdown Bar Chart
    const deptContainer = document.getElementById('analytics-dept-chart');
    if (deptContainer) {
        const totalEmp = summary.total_employees || 1;
        deptContainer.innerHTML = summary.dept_breakdown.map(d => {
            const pct = Math.round((d.count / totalEmp) * 100);
            return `
                <div class="chart-row">
                    <span style="width: 140px; font-weight: 600;">${d.department}</span>
                    <div class="chart-bar-bg">
                        <div class="chart-bar-fill" style="width: ${pct}%;"></div>
                    </div>
                    <span style="width: 50px; font-weight: 700;">${d.count} (${pct}%)</span>
                </div>
            `;
        }).join('');
    }

    // Render Task Distribution Bar Chart
    const taskContainer = document.getElementById('analytics-task-chart');
    if (taskContainer) {
        const totalT = summary.total_tasks || 1;
        taskContainer.innerHTML = summary.task_status_dist.map(t => {
            const pct = Math.round((t.count / totalT) * 100);
            return `
                <div class="chart-row">
                    <span style="width: 140px; font-weight: 600; text-transform: capitalize;">${t.status.replace('_', ' ')}</span>
                    <div class="chart-bar-bg">
                        <div class="chart-bar-fill fill-emerald" style="width: ${pct}%;"></div>
                    </div>
                    <span style="width: 50px; font-weight: 700;">${t.count} (${pct}%)</span>
                </div>
            `;
        }).join('');
    }
}

function exportReport(type, format = 'csv') {
    const token = getAuthToken();
    if (!token) return;

    const url = `/api/reports/${type}/export?format=${format}`;
    
    // Download via link click with auth token URL parameter or fetch blob
    fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.blob())
    .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast(`Downloaded ${type.toUpperCase()} ${format.toUpperCase()} report`, 'success');
    })
    .catch(err => showToast("Export failed: " + err.message, 'error'));
}
