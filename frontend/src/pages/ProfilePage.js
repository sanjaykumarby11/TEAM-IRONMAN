export function renderProfilePage(user) {
    return `
        <div class="welcome-banner">
            <div>
                <h2>Account & Security Profile Settings ⚙️</h2>
                <p class="text-muted">Update your contact details, designation, and security preferences.</p>
            </div>
        </div>

        <div class="dashboard-split margin-top-lg">
            <div class="dashboard-widget glassmorphic">
                <div class="widget-header">
                    <h3><i class="fa-solid fa-id-card text-primary"></i> Personal Details</h3>
                </div>
                <form id="profile-update-form">
                    <div class="input-group">
                        <label for="profile-name">Full Name</label>
                        <input type="text" id="profile-name" value="${user ? user.name : ''}" required>
                    </div>
                    <div class="input-group margin-top-sm">
                        <label for="profile-email">Work Email</label>
                        <input type="email" id="profile-email" value="${user ? user.email : ''}" disabled style="opacity: 0.6; cursor: not-allowed;">
                    </div>
                    <div class="input-group margin-top-sm">
                        <label for="profile-phone">Phone Number</label>
                        <input type="text" id="profile-phone" value="${user ? (user.phone || '') : ''}">
                    </div>
                    <div class="input-group margin-top-sm">
                        <label for="profile-designation">Designation</label>
                        <input type="text" id="profile-designation" value="${user ? (user.designation || '') : ''}">
                    </div>
                    <div class="input-group margin-top-sm">
                        <label for="profile-avatar">Avatar URL</label>
                        <input type="text" id="profile-avatar" value="${user ? (user.avatar_url || '') : ''}">
                    </div>
                    <button type="submit" class="btn btn-primary margin-top-md">
                        <i class="fa-solid fa-save"></i> Save Profile Changes
                    </button>
                </form>
            </div>

            <div class="dashboard-widget glassmorphic">
                <div class="widget-header">
                    <h3><i class="fa-solid fa-lock text-rose"></i> Password & Security</h3>
                </div>
                <form id="change-password-form">
                    <div class="input-group">
                        <label for="current-password">Current Password</label>
                        <input type="password" id="current-password" required placeholder="••••••••">
                    </div>
                    <div class="input-group margin-top-sm">
                        <label for="new-password">New Password</label>
                        <input type="password" id="new-password" required placeholder="••••••••">
                    </div>
                    <div class="input-group margin-top-sm">
                        <label for="confirm-password">Confirm New Password</label>
                        <input type="password" id="confirm-password" required placeholder="••••••••">
                    </div>
                    <button type="submit" class="btn btn-danger margin-top-md">
                        <i class="fa-solid fa-key"></i> Update Password
                    </button>
                </form>
            </div>
        </div>
    `;
}
