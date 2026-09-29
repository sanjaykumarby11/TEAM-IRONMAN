export function renderLeavePage(user) {
    const isManagerOrAdmin = user && (user.role === 'admin' || user.role === 'manager');

    return `
        <div class="welcome-banner" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%);">
            <div>
                <h2>Leave Management Hub 📅</h2>
                <p class="text-muted">Track leave balances, submit time-off requests, and review approvals.</p>
            </div>
            <div>
                <button class="btn btn-emerald" id="btn-open-leave-modal">
                    <i class="fa-solid fa-plus-circle"></i> Apply For Leave
                </button>
            </div>
        </div>

        <h3 class="margin-bottom-md">Your Available Leave Balances</h3>
        <div class="leave-balance-grid margin-bottom-md" id="leave-balances-container">
            <!-- Populated dynamically -->
        </div>

        ${isManagerOrAdmin ? `
            <div class="table-card glassmorphic margin-top-lg">
                <div class="table-header">
                    <h3><i class="fa-solid fa-user-check text-amber"></i> Manager Review Queue</h3>
                    <div class="filter-bar" style="margin-bottom: 0;">
                        <select id="leave-filter-status" class="filter-select">
                            <option value="pending">Pending Approval</option>
                            <option value="all">All Request Statuses</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="custom-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Department</th>
                                <th>Leave Type</th>
                                <th>Duration</th>
                                <th>Days</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="manager-leave-requests-body">
                            <!-- Populated dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>
        ` : ''}

        <div class="table-card glassmorphic margin-top-lg">
            <div class="table-header">
                <h3><i class="fa-solid fa-clock-rotate-left text-primary"></i> My Leave Request History</h3>
            </div>
            <div class="table-responsive">
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th>Leave Type</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Total Days</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Reviewed By</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="my-leave-history-body">
                        <!-- Populated dynamically -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
