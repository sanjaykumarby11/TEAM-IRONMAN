export function renderSidebar(user, activePage = 'dashboard') {
    const role = user ? user.role : 'employee';

    return `
        <aside class="sidebar">
            <div class="sidebar-brand">
                <div class="brand-icon">
                    <i class="fa-solid fa-layer-group"></i>
                </div>
                <div>
                    <span class="brand-title">EmpowerHub</span>
                    <span class="brand-subtitle">Enterprise Workspace</span>
                </div>
            </div>

            <nav class="sidebar-nav">
                <a href="#dashboard" class="nav-item ${activePage === 'dashboard' ? 'active' : ''}" data-page="dashboard">
                    <i class="fa-solid fa-chart-pie"></i>
                    <span>Dashboard</span>
                </a>
                <a href="#leave" class="nav-item ${activePage === 'leave' ? 'active' : ''}" data-page="leave">
                    <i class="fa-solid fa-calendar-check"></i>
                    <span>Leave Requests</span>
                </a>
                <a href="#tasks" class="nav-item ${activePage === 'tasks' ? 'active' : ''}" data-page="tasks">
                    <i class="fa-solid fa-list-check"></i>
                    <span>Tasks Workspace</span>
                </a>
                ${role === 'admin' || role === 'manager' ? `
                    <a href="#admin" class="nav-item ${activePage === 'admin' ? 'active' : ''}" data-page="admin">
                        <i class="fa-solid fa-users-gear"></i>
                        <span>Employee Directory</span>
                    </a>
                ` : ''}
                <a href="#profile" class="nav-item ${activePage === 'profile' ? 'active' : ''}" data-page="profile">
                    <i class="fa-solid fa-user-gear"></i>
                    <span>My Profile</span>
                </a>
            </nav>

            <div class="sidebar-user-card">
                <img src="${user ? user.avatar_url : 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}" alt="Avatar" class="user-avatar-sm">
                <div class="flex-grow">
                    <div class="user-name">${user ? user.name : 'Guest User'}</div>
                    <div class="user-role-badge">${user ? user.role.toUpperCase() : 'EMPLOYEE'}</div>
                </div>
                <button class="btn-icon" id="btn-logout" title="Sign Out">
                    <i class="fa-solid fa-power-off"></i>
                </button>
            </div>
        </aside>
    `;
}
