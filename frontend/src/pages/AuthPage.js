export function renderAuthPage() {
    return `
        <div id="auth-modal-overlay" class="modal-overlay active">
            <div class="auth-card glassmorphic">
                <div class="auth-header">
                    <div class="brand-logo">
                        <i class="fa-solid fa-layer-group"></i>
                        <span>EmpowerHub</span>
                    </div>
                    <h2>Employee & Task Portal</h2>
                    <p>Secure Enterprise Workforce Management</p>
                </div>

                <div class="auth-tabs">
                    <button type="button" class="auth-tab-btn active" id="tab-btn-login">Sign In</button>
                    <button type="button" class="auth-tab-btn" id="tab-btn-register">Register Account</button>
                </div>

                <form id="login-form" class="auth-form active">
                    <div class="input-group">
                        <label for="login-email"><i class="fa-solid fa-envelope"></i> Email Address</label>
                        <input type="email" id="login-email" required placeholder="Enter your email (e.g. user@company.com)">
                    </div>
                    <div class="input-group">
                        <label for="login-password"><i class="fa-solid fa-lock"></i> Password</label>
                        <input type="password" id="login-password" required placeholder="Enter your password">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">
                        <span>Sign In to Dashboard</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </form>

                <form id="register-form" class="auth-form hidden">
                    <div class="input-group">
                        <label for="reg-name"><i class="fa-solid fa-user"></i> Full Name</label>
                        <input type="text" id="reg-name" required placeholder="e.g. John Doe">
                    </div>
                    <div class="input-group">
                        <label for="reg-email"><i class="fa-solid fa-envelope"></i> Work Email</label>
                        <input type="email" id="reg-email" required placeholder="john.doe@company.com">
                    </div>
                    <div class="input-group">
                        <label for="reg-password"><i class="fa-solid fa-lock"></i> Password</label>
                        <input type="password" id="reg-password" required placeholder="Minimum 6 characters">
                    </div>
                    <div class="input-row">
                        <div class="input-group">
                            <label for="reg-department"><i class="fa-solid fa-building"></i> Department</label>
                            <select id="reg-department">
                                <option value="Engineering">Engineering</option>
                                <option value="Design">Design</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Sales">Sales</option>
                                <option value="HR & Management">HR & Management</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label for="reg-role"><i class="fa-solid fa-shield-halved"></i> Role</label>
                            <select id="reg-role">
                                <option value="employee">Employee</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-success btn-block margin-top-sm">
                        <span>Create Account</span>
                        <i class="fa-solid fa-user-plus"></i>
                    </button>
                </form>
            </div>
        </div>
    `;
}
