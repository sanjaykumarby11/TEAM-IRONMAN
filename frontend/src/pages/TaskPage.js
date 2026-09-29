export function renderTaskPage(user) {
    const isManagerOrAdmin = user && (user.role === 'admin' || user.role === 'manager');

    return `
        <div class="welcome-banner" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%);">
            <div>
                <h2>Tasks Workspace & Kanban Board 📋</h2>
                <p class="text-muted">Manage task delegation, track progress percentages, and collaborate on deliverables.</p>
            </div>
            <div class="welcome-actions">
                ${isManagerOrAdmin ? `
                    <button class="btn btn-primary" id="btn-open-create-task-modal">
                        <i class="fa-solid fa-plus-circle"></i> Create New Task
                    </button>
                ` : ''}
                <div class="btn-group">
                    <button class="btn btn-secondary active" id="btn-view-kanban"><i class="fa-solid fa-table-columns"></i> Kanban</button>
                    <button class="btn btn-secondary" id="btn-view-list"><i class="fa-solid fa-list"></i> List</button>
                </div>
            </div>
        </div>

        <div class="filter-bar glassmorphic" style="padding: 14px 20px;">
            <select id="task-filter-dept" class="filter-select">
                <option value="all">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="HR & Management">HR & Management</option>
            </select>
            <select id="task-filter-priority" class="filter-select">
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
            </select>
            <select id="task-filter-scope" class="filter-select">
                <option value="all">All Tasks</option>
                <option value="my_tasks">Assigned To Me</option>
            </select>
        </div>

        <!-- KANBAN VIEW -->
        <div id="tasks-kanban-view" class="kanban-board margin-top-lg">
            <div class="kanban-column" data-status="to_do">
                <div class="column-header">
                    <h4><i class="fa-solid fa-circle-dot text-amber"></i> To Do</h4>
                    <span class="badge badge-warning" id="count-to_do">0</span>
                </div>
                <div class="task-list" id="list-to_do"></div>
            </div>

            <div class="kanban-column" data-status="in_progress">
                <div class="column-header">
                    <h4><i class="fa-solid fa-spinner text-primary"></i> In Progress</h4>
                    <span class="badge badge-accent" id="count-in_progress">0</span>
                </div>
                <div class="task-list" id="list-in_progress"></div>
            </div>

            <div class="kanban-column" data-status="in_review">
                <div class="column-header">
                    <h4><i class="fa-solid fa-eye text-violet"></i> In Review</h4>
                    <span class="badge badge-secondary" id="count-in_review">0</span>
                </div>
                <div class="task-list" id="list-in_review"></div>
            </div>

            <div class="kanban-column" data-status="completed">
                <div class="column-header">
                    <h4><i class="fa-solid fa-circle-check text-emerald"></i> Completed</h4>
                    <span class="badge badge-success" id="count-completed">0</span>
                </div>
                <div class="task-list" id="list-completed"></div>
            </div>
        </div>

        <!-- LIST VIEW -->
        <div id="tasks-list-view" class="table-card glassmorphic margin-top-lg hidden">
            <div class="table-responsive">
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th>Task Title</th>
                            <th>Assignee</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Progress</th>
                            <th>Due Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="task-table-body">
                        <!-- Populated dynamically -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
