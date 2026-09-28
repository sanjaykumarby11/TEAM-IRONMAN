/* Main Application Orchestrator & State Manager */

let activeTab = 'dashboard';
let userNotifications = [];

document.addEventListener('DOMContentLoaded', () => {
    // Check if token exists
    const token = getAuthToken();
    const user = getCurrentUser();

    if (token && user) {
        closeModal('auth-modal-overlay');
        const container = document.getElementById('app-container');
        if (container) container.classList.remove('hidden');
        initApplicationState();
        switchTab('dashboard');
    } else {
        openModal('auth-modal-overlay');
        const container = document.getElementById('app-container');
        if (container) container.classList.add('hidden');
    }
});

function initApplicationState() {
    const user = getCurrentUser();
    if (!user) return;

    updateUserHeaderUI(user);
    applyRolePermissions(user.role);

    // Load initial datasets
    loadNotifications();
    loadLeaveBalances();
    loadMyLeaveHistory();
    loadTasks();

    if (user.role === 'admin' || user.role === 'manager') {
        loadAllLeaveApprovals();
    }
    if (user.role === 'admin') {
        loadEmployeeDirectory();
    }
    loadAnalyticsDashboard();
}

function updateUserHeaderUI(user) {
    if (!user) return;

    const setElemText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };
    const setElemSrc = (id, src) => {
        const el = document.getElementById(id);
        if (el) el.src = src;
    };

    const avatarUrl = user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'user'}`;

    setElemText('sidebar-user-name', user.name || 'User');
    setElemText('sidebar-user-role', (user.role || 'employee').toUpperCase());
    setElemSrc('sidebar-user-avatar', avatarUrl);

    setElemText('header-user-name', user.name || 'User');
    setElemSrc('header-user-avatar', avatarUrl);

    setElemText('dash-greeting-name', user.name || 'User');
}

function switchTab(tabId) {
    activeTab = tabId;

    // Update Nav Items active class
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.getAttribute('data-tab') === tabId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update Section Visibility
    const sections = document.querySelectorAll('.tab-content');
    sections.forEach(sec => {
        if (sec.id === `section-${tabId}`) {
            sec.classList.remove('hidden');
            sec.classList.add('active');
        } else {
            sec.classList.add('hidden');
            sec.classList.remove('active');
        }
    });

    // Update Header Titles
    const titleMap = {
        'dashboard': { title: 'Workspace Dashboard', sub: 'Welcome back to your leave and task control panel.' },
        'leave': { title: 'Leave Center & Balances', sub: 'Manage leave requests, review allocations, and track balances.' },
        'leave-approvals': { title: 'Leave Approval Queue', sub: 'Manager and Administrator workflow to approve or decline time off.' },
        'tasks': { title: 'Task Workspace', sub: 'Assign tasks, monitor project board, and update progress percent.' },
        'employees': { title: 'Employee Directory & Access Control', sub: 'Admin dashboard to manage staff accounts, roles, and credentials.' },
        'reports': { title: 'Reports & Productivity Analytics', sub: 'Download datasets and inspect team performance charts.' }
    };

    if (titleMap[tabId]) {
        const pageTitle = document.getElementById('page-title');
        const pageSub = document.getElementById('page-subtitle');
        if (pageTitle) pageTitle.textContent = titleMap[tabId].title;
        if (pageSub) pageSub.textContent = titleMap[tabId].sub;
    }

    // Refresh tab specific datasets
    if (tabId === 'leave-approvals') loadAllLeaveApprovals();
    if (tabId === 'employees') loadEmployeeDirectory();
    if (tabId === 'reports') loadAnalyticsDashboard();
}

/* NOTIFICATIONS MANAGEMENT */

async function loadNotifications() {
    try {
        const res = await apiRequest('/api/notifications');
        userNotifications = res.notifications || [];
        renderNotificationsUI();
    } catch (err) {
        console.error("Error loading notifications:", err);
    }
}

function renderNotificationsUI() {
    const listContainer = document.getElementById('notifications-list');
    const badge = document.getElementById('notification-count-badge');
    if (!listContainer) return;

    const unread = userNotifications.filter(n => !n.is_read);

    if (badge) {
        if (unread.length > 0) badge.classList.remove('hidden');
        else badge.classList.add('hidden');
    }

    if (userNotifications.length === 0) {
        listContainer.innerHTML = `<div class="empty-state">No notifications.</div>`;
        return;
    }

    listContainer.innerHTML = userNotifications.map(n => `
        <div class="notification-item ${n.is_read ? '' : 'unread'}" onclick="markSingleNotificationRead(${n.id})">
            <div class="notif-title">${n.title}</div>
            <div class="notif-body">${n.message}</div>
            <div style="font-size: 9px;" class="text-muted margin-top-xs">${n.created_at}</div>
        </div>
    `).join('');
}

function toggleNotifications() {
    const dropdown = document.getElementById('notifications-dropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
}

async function markSingleNotificationRead(id) {
    try {
        await apiRequest(`/api/notifications/${id}/read`, 'PUT');
        loadNotifications();
    } catch (err) {
        console.error(err);
    }
}

async function markAllNotificationsRead() {
    try {
        await apiRequest('/api/notifications/read-all', 'PUT');
        loadNotifications();
        showToast('All notifications marked as read', 'info');
    } catch (err) {
        console.error(err);
    }
}

/* MODAL HELPERS */

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        modal.classList.add('hidden');
    }
}
