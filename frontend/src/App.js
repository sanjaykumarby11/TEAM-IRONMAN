import { getCurrentUser, setAuthToken, setCurrentUser, showToast } from './services/api.js';
import { loginUser, registerUser, logoutUser, updateProfile, changePassword } from './services/auth.js';
import { fetchLeaveBalances, fetchMyLeaveHistory, submitLeaveApplication, fetchAllLeaves, reviewLeaveRequest, cancelLeaveRequest } from './services/leave.js';
import { fetchTasks, createNewTask, fetchTaskDetails, updateTaskStatusProgress, updateTaskDetails, deleteTask, addTaskComment } from './services/task.js';
import { fetchEmployees, createEmployee, updateEmployee, fetchAnalytics, fetchNotifications, markAllNotificationsRead } from './services/admin.js';

import { renderSidebar } from './components/Sidebar.js';
import { renderNavbar } from './components/Navbar.js';
import { renderStatCard } from './components/StatCard.js';
import { renderAuthPage } from './pages/AuthPage.js';
import { renderDashboardPage } from './pages/DashboardPage.js';
import { renderLeavePage } from './pages/LeavePage.js';
import { renderTaskPage } from './pages/TaskPage.js';
import { renderAdminPage } from './pages/AdminPage.js';
import { renderProfilePage } from './pages/ProfilePage.js';

class App {
    constructor() {
        this.currentUser = getCurrentUser();
        this.activePage = 'dashboard';
        this.init();
    }

    init() {
        this.renderRoot();
        this.attachGlobalListeners();

        if (this.currentUser) {
            this.navigate(window.location.hash.replace('#', '') || 'dashboard');
        }
    }

    renderRoot() {
        const root = document.getElementById('app-root');
        if (!root) return;

        if (!this.currentUser) {
            root.innerHTML = renderAuthPage();
            this.attachAuthEvents();
            return;
        }

        root.innerHTML = `
            <div id="toast-container" class="toast-container"></div>
            <div class="app-layout">
                ${renderSidebar(this.currentUser, this.activePage)}
                <main class="main-content">
                    <div id="navbar-container">
                        ${renderNavbar(this.currentUser)}
                    </div>
                    <div id="page-content">
                        <!-- Dynamic page view -->
                    </div>
                </main>
            </div>

            <!-- GLOBAL MODALS -->
            <div id="leave-apply-modal" class="modal-overlay">
                <div class="modal-card glassmorphic">
                    <div class="modal-header">
                        <h3><i class="fa-solid fa-plane-departure text-emerald"></i> Apply For Time Off</h3>
                        <button class="btn-icon close-modal-btn"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <form id="leave-apply-form">
                        <div class="input-group">
                            <label>Leave Category</label>
                            <select id="modal-leave-type">
                                <option value="annual">Annual Leave (20d)</option>
                                <option value="sick">Sick Leave (10d)</option>
                                <option value="casual">Casual Leave (8d)</option>
                                <option value="maternity">Maternity/Paternity (90d)</option>
                                <option value="unpaid">Unpaid Leave</option>
                            </select>
                        </div>
                        <div class="input-row margin-top-sm">
                            <div class="input-group">
                                <label>Start Date</label>
                                <input type="date" id="modal-leave-start" required>
                            </div>
                            <div class="input-group">
                                <label>End Date</label>
                                <input type="date" id="modal-leave-end" required>
                            </div>
                        </div>
                        <div class="input-group margin-top-sm">
                            <label>Total Duration (Days)</label>
                            <input type="number" id="modal-leave-days" readonly placeholder="Calculated automatically">
                        </div>
                        <div class="input-group margin-top-sm">
                            <label>Reason for Leave</label>
                            <textarea id="modal-leave-reason" rows="3" required placeholder="State your request justification..."></textarea>
                        </div>
                        <div class="input-group margin-top-sm">
                            <label>Emergency Contact Phone</label>
                            <input type="text" id="modal-leave-emergency" placeholder="+1 555-0000">
                        </div>
                        <button type="submit" class="btn btn-emerald btn-block margin-top-md">
                            <i class="fa-solid fa-paper-plane"></i> Submit Application
                        </button>
                    </form>
                </div>
            </div>

            <div id="create-task-modal" class="modal-overlay">
                <div class="modal-card glassmorphic">
                    <div class="modal-header">
                        <h3><i class="fa-solid fa-tasks text-primary"></i> Delegate New Task</h3>
                        <button class="btn-icon close-modal-btn"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <form id="create-task-form">
                        <div class="input-group">
                            <label>Task Title</label>
                            <input type="text" id="task-title-input" required placeholder="e.g. Implement Module Authorization">
                        </div>
                        <div class="input-group margin-top-sm">
                            <label>Description</label>
                            <textarea id="task-desc-input" rows="3" placeholder="Provide detailed task requirements..."></textarea>
                        </div>
                        <div class="input-row margin-top-sm">
                            <div class="input-group">
                                <label>Assign Employee</label>
                                <select id="task-assignee-select" required></select>
                            </div>
                            <div class="input-group">
                                <label>Priority Level</label>
                                <select id="task-priority-select">
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                        </div>
                        <div class="input-row margin-top-sm">
                            <div class="input-group">
                                <label>Due Date</label>
                                <input type="date" id="task-duedate-input" required>
                            </div>
                            <div class="input-group">
                                <label>Department</label>
                                <select id="task-dept-select">
                                    <option value="Engineering">Engineering</option>
                                    <option value="Design">Design</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Sales">Sales</option>
                                    <option value="HR & Management">HR & Management</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block margin-top-md">
                            <i class="fa-solid fa-plus-circle"></i> Create Task
                        </button>
                    </form>
                </div>
            </div>
        `;

        this.attachDashboardEvents();
    }

    attachAuthEvents() {
        const tabLogin = document.getElementById('tab-btn-login');
        const tabReg = document.getElementById('tab-btn-register');
        const formLogin = document.getElementById('login-form');
        const formReg = document.getElementById('register-form');

        if (tabLogin && tabReg) {
            tabLogin.addEventListener('click', () => {
                tabLogin.classList.add('active');
                tabReg.classList.remove('active');
                formLogin.classList.remove('hidden');
                formReg.classList.add('hidden');
            });

            tabReg.addEventListener('click', () => {
                tabReg.classList.add('active');
                tabLogin.classList.remove('active');
                formReg.classList.remove('hidden');
                formLogin.classList.add('hidden');
            });
        }

        if (formLogin) {
            formLogin.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const pw = document.getElementById('login-password').value;
                try {
                    const res = await loginUser(email, pw);
                    showToast('Login successful!', 'success');
                    this.currentUser = res.user;
                    this.renderRoot();
                    this.navigate('dashboard');
                } catch (err) {
                    showToast(err.message, 'error');
                }
            });
        }

        if (formReg) {
            formReg.addEventListener('submit', async (e) => {
                e.preventDefault();
                const payload = {
                    name: document.getElementById('reg-name').value,
                    email: document.getElementById('reg-email').value,
                    password: document.getElementById('reg-password').value,
                    department: document.getElementById('reg-department').value,
                    role: document.getElementById('reg-role').value
                };
                try {
                    await registerUser(payload);
                    showToast('Registration successful! Please login.', 'success');
                    tabLogin.click();
                } catch (err) {
                    showToast(err.message, 'error');
                }
            });
        }
    }

    attachGlobalListeners() {
        window.addEventListener('hashchange', () => {
            const page = window.location.hash.replace('#', '') || 'dashboard';
            if (this.currentUser) this.navigate(page);
        });

        document.addEventListener('click', (e) => {
            if (e.target.closest('.close-modal-btn')) {
                const overlay = e.target.closest('.modal-overlay');
                if (overlay) overlay.classList.remove('active');
            }
        });
    }

    attachDashboardEvents() {
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                logoutUser();
                this.currentUser = null;
                showToast('Signed out successfully.', 'info');
                this.renderRoot();
            });
        }

        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const page = item.dataset.page;
                if (page) this.navigate(page);
            });
        });

        const leaveForm = document.getElementById('leave-apply-form');
        if (leaveForm) {
            const startInput = document.getElementById('modal-leave-start');
            const endInput = document.getElementById('modal-leave-end');
            const daysInput = document.getElementById('modal-leave-days');

            const calcDays = () => {
                if (startInput.value && endInput.value) {
                    const start = new Date(startInput.value);
                    const end = new Date(endInput.value);
                    const diffTime = end - start;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    daysInput.value = diffDays > 0 ? diffDays : 0;
                }
            };

            startInput.addEventListener('change', calcDays);
            endInput.addEventListener('change', calcDays);

            leaveForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const payload = {
                    leave_type: document.getElementById('modal-leave-type').value,
                    start_date: startInput.value,
                    end_date: endInput.value,
                    total_days: daysInput.value,
                    reason: document.getElementById('modal-leave-reason').value,
                    emergency_contact: document.getElementById('modal-leave-emergency').value
                };

                try {
                    await submitLeaveApplication(payload);
                    showToast('Leave request submitted successfully!', 'success');
                    document.getElementById('leave-apply-modal').classList.remove('active');
                    if (this.activePage === 'leave' || this.activePage === 'dashboard') {
                        this.loadPageData();
                    }
                } catch (err) {
                    showToast(err.message, 'error');
                }
            });
        }
    }

    async navigate(page) {
        this.activePage = page;        const pageContainer = document.getElementById('page-content');
        if (!pageContainer) return;

        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.dataset.page === page) item.classList.add('active');
            else item.classList.remove('active');
        });

        switch (page) {
            case 'leave':
                pageContainer.innerHTML = renderLeavePage(this.currentUser);
                break;
            case 'tasks':
                pageContainer.innerHTML = renderTaskPage(this.currentUser);
                break;
            case 'admin':
                pageContainer.innerHTML = renderAdminPage(this.currentUser);
                break;
            case 'profile':
                pageContainer.innerHTML = renderProfilePage(this.currentUser);
                break;
            case 'dashboard':
            default:
                pageContainer.innerHTML = renderDashboardPage(this.currentUser);
                break;
        }

        this.loadPageData();
    }

    async loadPageData() {
        if (this.activePage === 'dashboard') {
            await this.loadDashboardData();
        } else if (this.activePage === 'leave') {
            await this.loadLeaveData();
        } else if (this.activePage === 'tasks') {
            await this.loadTaskData();
        } else if (this.activePage === 'admin') {
            await this.loadAdminData();
        } else if (this.activePage === 'profile') {
            this.attachProfileData();
        }
    }

    async loadDashboardData() {
        try {
            const analytics = await fetchAnalytics();
            const summary = analytics.summary;
            const grid = document.getElementById('dashboard-stats-grid');
            if (grid) {
                grid.innerHTML = `
                    ${renderStatCard('fa-solid fa-users', 'icon-emerald', 'Total Active Workforce', summary.total_employees, 'Active Team')}
                    ${renderStatCard('fa-solid fa-calendar-minus', 'icon-amber', 'Pending Leave Requests', summary.pending_leaves, 'Requires Review')}
                    ${renderStatCard('fa-solid fa-tasks', 'icon-violet', 'Total Tasks Delegated', summary.total_tasks, `${summary.completed_tasks} Completed`)}
                    ${renderStatCard('fa-solid fa-spinner', 'icon-rose', 'Tasks In Progress', summary.in_progress_tasks, 'Active Development')}
                `;
            }

            const historyRes = await fetchMyLeaveHistory();
            const leaveBody = document.getElementById('dash-recent-leaves-body');
            if (leaveBody) {
                leaveBody.innerHTML = historyRes.leave_requests.slice(0, 5).map(l => `
                    <tr>
                        <td><strong>${l.leave_type.toUpperCase()}</strong></td>
                        <td>${l.start_date} to ${l.end_date}</td>
                        <td>${l.total_days} d</td>
                        <td><span class="badge badge-${l.status}">${l.status}</span></td>
                    </tr>
                `).join('') || `<tr><td colspan="4" class="text-center text-muted">No leave applications found.</td></tr>`;
            }

            const tasksRes = await fetchTasks({ scope: 'my_tasks' });
            const taskBody = document.getElementById('dash-recent-tasks-body');
            if (taskBody) {
                taskBody.innerHTML = tasksRes.tasks.slice(0, 5).map(t => `
                    <tr>
                        <td><strong>${t.title}</strong></td>
                        <td><span class="badge badge-${t.priority === 'urgent' ? 'danger' : 'warning'}">${t.priority}</span></td>
                        <td>${t.due_date}</td>
                        <td>${t.progress_percent}%</td>
                    </tr>
                `).join('') || `<tr><td colspan="4" class="text-center text-muted">No active tasks assigned.</td></tr>`;
            }
        } catch (err) {
            console.error('Error loading dashboard data:', err);
        }
    }

    async loadLeaveData() {
        try {
            const balRes = await fetchLeaveBalances();
            const bal = balRes.balances;
            const container = document.getElementById('leave-balances-container');
            if (container) {
                container.innerHTML = `
                    <div class="balance-card glassmorphic border-emerald">
                        <div class="balance-header"><span>Annual Leave</span><i class="fa-solid fa-plane text-emerald"></i></div>
                        <div class="balance-num">${bal.annual_remaining} <span class="balance-total">/ ${bal.annual_leave_allocated} Days</span></div>
                        <div class="progress-bar"><div class="progress-fill fill-emerald" style="width: ${(bal.annual_remaining/bal.annual_leave_allocated)*100}%"></div></div>
                        <div class="balance-used-text">${bal.annual_leave_used} days used</div>
                    </div>
                    <div class="balance-card glassmorphic border-amber">
                        <div class="balance-header"><span>Sick Leave</span><i class="fa-solid fa-notes-medical text-amber"></i></div>
                        <div class="balance-num">${bal.sick_remaining} <span class="balance-total">/ ${bal.sick_leave_allocated} Days</span></div>
                        <div class="progress-bar"><div class="progress-fill fill-amber" style="width: ${(bal.sick_remaining/bal.sick_leave_allocated)*100}%"></div></div>
                        <div class="balance-used-text">${bal.sick_leave_used} days used</div>
                    </div>
                    <div class="balance-card glassmorphic border-violet">
                        <div class="balance-header"><span>Casual Leave</span><i class="fa-solid fa-umbrella-beach text-violet"></i></div>
                        <div class="balance-num">${bal.casual_remaining} <span class="balance-total">/ ${bal.casual_leave_allocated} Days</span></div>
                        <div class="progress-bar"><div class="progress-fill fill-violet" style="width: ${(bal.casual_remaining/bal.casual_leave_allocated)*100}%"></div></div>
                        <div class="balance-used-text">${bal.casual_leave_used} days used</div>
                    </div>
                `;
            }

            const openLeaveBtn = document.getElementById('btn-open-leave-modal');
            if (openLeaveBtn) {
                openLeaveBtn.addEventListener('click', () => {
                    document.getElementById('leave-apply-modal').classList.add('active');
                });
            }

            const myHistory = await fetchMyLeaveHistory();
            const myBody = document.getElementById('my-leave-history-body');
            if (myBody) {
                myBody.innerHTML = myHistory.leave_requests.map(l => `
                    <tr>
                        <td><strong>${l.leave_type.toUpperCase()}</strong></td>
                        <td>${l.start_date}</td>
                        <td>${l.end_date}</td>
                        <td>${l.total_days} d</td>
                        <td>${l.reason}</td>
                        <td><span class="badge badge-${l.status}">${l.status}</span></td>
                        <td>${l.reviewer_name || 'N/A'}</td>
                        <td>
                            ${l.status === 'pending' ? `<button class="btn btn-outline btn-cancel-leave" data-id="${l.id}">Cancel</button>` : ''}
                        </td>
                    </tr>
                `).join('') || `<tr><td colspan="8" class="text-center text-muted">No leave history.</td></tr>`;

                document.querySelectorAll('.btn-cancel-leave').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        try {
                            await cancelLeaveRequest(btn.dataset.id);
                            showToast('Leave request cancelled.', 'info');
                            this.loadLeaveData();
                        } catch (err) {
                            showToast(err.message, 'error');
                        }
                    });
                });
            }

            if (this.currentUser.role === 'admin' || this.currentUser.role === 'manager') {
                const allLeaves = await fetchAllLeaves('pending');
                const mgrBody = document.getElementById('manager-leave-requests-body');
                if (mgrBody) {
                    mgrBody.innerHTML = allLeaves.leave_requests.map(l => `
                        <tr>
                            <td><strong>${l.employee_name}</strong></td>
                            <td>${l.department}</td>
                            <td>${l.leave_type.toUpperCase()}</td>
                            <td>${l.start_date} - ${l.end_date}</td>
                            <td>${l.total_days} d</td>
                            <td>${l.reason}</td>
                            <td><span class="badge badge-${l.status}">${l.status}</span></td>
                            <td>
                                <button class="btn btn-success btn-review-leave" data-id="${l.id}" data-action="approved"><i class="fa-solid fa-check"></i></button>
                                <button class="btn btn-danger btn-review-leave" data-id="${l.id}" data-action="rejected"><i class="fa-solid fa-xmark"></i></button>
                            </td>
                        </tr>
                    `).join('') || `<tr><td colspan="8" class="text-center text-muted">No pending leave requests requiring review.</td></tr>`;

                    document.querySelectorAll('.btn-review-leave').forEach(btn => {
                        btn.addEventListener('click', async () => {
                            try {
                                await reviewLeaveRequest(btn.dataset.id, btn.dataset.action, 'Reviewed by manager');
                                showToast(`Leave request ${btn.dataset.action}!`, 'success');
                                this.loadLeaveData();
                            } catch (err) {
                                showToast(err.message, 'error');
                            }
                        });
                    });
                }
            }
        } catch (err) {
            console.error('Error loading leave data:', err);
        }
    }

    async loadTaskData() {
        try {
            const tasksRes = await fetchTasks();
            const tasks = tasksRes.tasks;

            const statuses = ['to_do', 'in_progress', 'in_review', 'completed'];
            statuses.forEach(s => {
                const col = document.getElementById(`list-${s}`);
                const count = document.getElementById(`count-${s}`);
                const filtered = tasks.filter(t => t.status === s);
                if (count) count.textContent = filtered.length;
                if (col) {
                    col.innerHTML = filtered.map(t => `
                        <div class="task-card" data-id="${t.id}">
                            <div class="task-meta">
                                <span class="badge badge-${t.priority === 'urgent' ? 'danger' : 'warning'}">${t.priority}</span>
                                <small class="text-muted">${t.due_date}</small>
                            </div>
                            <div class="task-title">${t.title}</div>
                            <div class="task-footer">
                                <span class="text-muted">${t.assignee_name}</span>
                                <span class="badge badge-accent">${t.progress_percent}%</span>
                            </div>
                        </div>
                    `).join('');
                }
            });
        } catch (err) {
            console.error('Error loading task data:', err);
        }
    }

    async loadAdminData() {
        try {
            const empRes = await fetchEmployees();
            const body = document.getElementById('employees-table-body');
            if (body) {
                body.innerHTML = empRes.employees.map(e => `
                    <tr>
                        <td><strong>${e.name}</strong><br><small class="text-muted">${e.email}</small></td>
                        <td><span class="badge badge-accent">${e.role.toUpperCase()}</span></td>
                        <td>${e.department}</td>
                        <td>${e.designation}</td>
                        <td><span class="badge badge-success">${e.status}</span></td>
                        <td>${e.annual_leave_used || 0} days</td>
                        ${this.currentUser.role === 'admin' ? `<td><button class="btn btn-outline">Edit</button></td>` : ''}
                    </tr>
                `).join('');
            }
        } catch (err) {
            console.error('Error loading admin data:', err);
        }
    }

    attachProfileData() {
        const pForm = document.getElementById('profile-update-form');
        if (pForm) {
            pForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    const payload = {
                        name: document.getElementById('profile-name').value,
                        phone: document.getElementById('profile-phone').value,
                        designation: document.getElementById('profile-designation').value,
                        avatar_url: document.getElementById('profile-avatar').value
                    };
                    await updateProfile(payload);
                    showToast('Profile updated successfully!', 'success');
                } catch (err) {
                    showToast(err.message, 'error');
                }
            });
        }

        const pwForm = document.getElementById('change-password-form');
        if (pwForm) {
            pwForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const cur = document.getElementById('current-password').value;
                const nw = document.getElementById('new-password').value;
                const cf = document.getElementById('confirm-password').value;

                if (nw !== cf) {
                    showToast('New passwords do not match.', 'error');
                    return;
                }

                try {
                    await changePassword({ current_password: cur, new_password: nw });
                    showToast('Password updated successfully!', 'success');
                    pwForm.reset();
                } catch (err) {
                    showToast(err.message, 'error');
                }
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
