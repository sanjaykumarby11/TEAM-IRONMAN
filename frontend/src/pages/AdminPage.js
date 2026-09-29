export function renderAdminPage(user) {
    const isAdmin = user && user.role === 'admin';

    return `
        <div class="welcome-banner" style="background: linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%);">
            <div>
                <h2>Employee Directory & System Admin 👥</h2>
                <p class="text-muted">Manage workforce accounts, role designations, and export system metrics.</p>
            </div>
            <div class="welcome-actions">
                ${isAdmin ? `
                    <button class="btn btn-primary" id="btn-open-add-employee-modal">
                        <i class="fa-solid fa-user-plus"></i> Add Employee
                    </button>
                ` : ''}
                <a href="/api/reports/leave/export?format=csv" class="btn btn-secondary" target="_blank">
                    <i class="fa-solid fa-file-csv"></i> Export Leaves (CSV)
                </a>
                <a href="/api/reports/task/export?format=csv" class="btn btn-secondary" target="_blank">
                    <i class="fa-solid fa-file-csv"></i> Export Tasks (CSV)
                </a>
            </div>
        </div>

        <div class="table-card glassmorphic margin-top-lg">
            <div class="table-header">
                <h3><i class="fa-solid fa-users text-primary"></i> Team Workforce Directory</h3>
            </div>
            <div class="table-responsive">
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Role</th>
                            <th>Department</th>
                            <th>Designation</th>
                            <th>Status</th>
                            <th>Leave Used</th>
                            ${isAdmin ? '<th>Actions</th>' : ''}
                        </tr>
                    </thead>
                    <tbody id="employees-table-body">
                        <!-- Populated dynamically -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
