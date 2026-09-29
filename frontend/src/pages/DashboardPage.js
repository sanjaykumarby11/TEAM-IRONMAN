export function renderDashboardPage(user) {
    return `
        <div class="welcome-banner">
            <div>
                <h2>Hello, ${user ? user.name : 'Team Member'}! 👋</h2>
                <p class="text-muted">Here is your workforce activity summary and quick access portal.</p>
            </div>
            <div class="welcome-actions">
                <button class="btn btn-primary" id="dash-apply-leave-btn">
                    <i class="fa-solid fa-plus"></i> Apply Leave
                </button>
                <button class="btn btn-secondary" id="dash-view-tasks-btn">
                    <i class="fa-solid fa-list-check"></i> My Tasks
                </button>
            </div>
        </div>

        <div class="stats-grid" id="dashboard-stats-grid">
            <!-- Populated via Javascript -->
        </div>

        <div class="dashboard-split margin-top-lg">
            <div class="dashboard-widget glassmorphic">
                <div class="widget-header">
                    <h3><i class="fa-solid fa-clock-rotate-left text-primary"></i> Recent Leave Applications</h3>
                    <a href="#leave" class="btn-text">View All</a>
                </div>
                <div class="table-responsive">
                    <table class="custom-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Dates</th>
                                <th>Days</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="dash-recent-leaves-body">
                            <!-- Populated dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="dashboard-widget glassmorphic">
                <div class="widget-header">
                    <h3><i class="fa-solid fa-tasks text-emerald"></i> Active Assigned Tasks</h3>
                    <a href="#tasks" class="btn-text">View All</a>
                </div>
                <div class="table-responsive">
                    <table class="custom-table">
                        <thead>
                            <tr>
                                <th>Task</th>
                                <th>Priority</th>
                                <th>Due Date</th>
                                <th>Progress</th>
                            </tr>
                        </thead>
                        <tbody id="dash-recent-tasks-body">
                            <!-- Populated dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}
