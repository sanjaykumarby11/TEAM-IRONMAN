export function renderNavbar(user, unreadCount = 0) {
    return `
        <header class="top-header">
            <div class="header-left">
                <h1 id="page-title">Dashboard</h1>
                <p class="text-muted" id="page-subtitle">Welcome back, ${user ? user.name : 'User'}</p>
            </div>
            <div class="header-right">
                <div style="position: relative;">
                    <button class="btn-icon-bg" id="btn-notifications-toggle" title="Notifications">
                        <i class="fa-solid fa-bell"></i>
                        ${unreadCount > 0 ? '<span class="badge-dot"></span>' : ''}
                    </button>
                    <div id="notifications-dropdown" class="notifications-dropdown hidden">
                        <div class="dropdown-header">
                            <strong>Notifications</strong>
                            <button class="btn-text" id="btn-mark-all-read">Mark all as read</button>
                        </div>
                        <div id="notifications-list-container" class="notifications-list">
                            <!-- Populated dynamically -->
                        </div>
                    </div>
                </div>
                <button class="btn-profile" id="btn-profile-toggle">
                    <img src="${user ? user.avatar_url : 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}" alt="Avatar" class="user-avatar-xs">
                    <span>${user ? user.name.split(' ')[0] : 'User'}</span>
                    <i class="fa-solid fa-chevron-down" style="font-size: 11px;"></i>
                </button>
            </div>
        </header>
    `;
}
