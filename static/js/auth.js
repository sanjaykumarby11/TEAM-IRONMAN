/* Authentication and User Session Management */

function switchPersona(email, password) {
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    if (emailInput && passwordInput) {
        emailInput.value = email;
        passwordInput.value = password;
    }
    toggleAuthTab('login');
}

function toggleAuthTab(tab) {
    const loginBtn = document.getElementById('tab-btn-login');
    const regBtn = document.getElementById('tab-btn-register');
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');

    if (!loginBtn || !regBtn || !loginForm || !regForm) return;

    if (tab === 'login') {
        loginBtn.classList.add('active');
        regBtn.classList.remove('active');
        loginForm.classList.remove('hidden');
        loginForm.classList.add('active');
        regForm.classList.add('hidden');
        regForm.classList.remove('active');
    } else {
        regBtn.classList.add('active');
        loginBtn.classList.remove('active');
        regForm.classList.remove('hidden');
        regForm.classList.add('active');
        loginForm.classList.add('hidden');
        loginForm.classList.remove('active');
    }
}

// Login Handler
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            try {
                const res = await apiRequest('/api/auth/login', 'POST', { email, password });
                setAuthToken(res.token);
                setCurrentUser(res.user);

                showToast(`Welcome back, ${res.user.name}!`, 'success');
                
                // Close auth modal and show main app layout
                closeModal('auth-modal-overlay');
                const appContainer = document.getElementById('app-container');
                if (appContainer) appContainer.classList.remove('hidden');

                // Initialize state & navigate to dashboard tab
                initApplicationState();
                switchTab('dashboard');
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    const regForm = document.getElementById('register-form');
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;
            const department = document.getElementById('reg-department').value;
            const role = document.getElementById('reg-role').value;
            const designation = document.getElementById('reg-designation').value.trim();

            try {
                await apiRequest('/api/auth/register', 'POST', {
                    name, email, password, department, role, designation
                });
                showToast('Registration successful! Please sign in with your credentials.', 'success');
                toggleAuthTab('login');
                document.getElementById('login-email').value = email;
                document.getElementById('login-password').value = password;
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }
});

function logout() {
    setAuthToken('');
    setCurrentUser(null);
    const appContainer = document.getElementById('app-container');
    if (appContainer) appContainer.classList.add('hidden');
    openModal('auth-modal-overlay');
    showToast('Logged out successfully.', 'info');
}

function applyRolePermissions(role) {
    const mgrAdminEls = document.querySelectorAll('.manager-admin-only');
    const adminEls = document.querySelectorAll('.admin-only');

    if (role === 'admin') {
        mgrAdminEls.forEach(el => el.classList.remove('hidden'));
        adminEls.forEach(el => el.classList.remove('hidden'));
    } else if (role === 'manager') {
        mgrAdminEls.forEach(el => el.classList.remove('hidden'));
        adminEls.forEach(el => el.classList.add('hidden'));
    } else {
        // Employee
        mgrAdminEls.forEach(el => el.classList.add('hidden'));
        adminEls.forEach(el => el.classList.add('hidden'));
    }
}

function openProfileModal() {
    const user = getCurrentUser();
    if (!user) return;

    const profName = document.getElementById('prof-name');
    const profPhone = document.getElementById('prof-phone');
    const profDesig = document.getElementById('prof-designation');

    if (profName) profName.value = user.name || '';
    if (profPhone) profPhone.value = user.phone || '';
    if (profDesig) profDesig.value = user.designation || '';

    openModal('modal-user-profile');
}

async function submitProfileUpdate(e) {
    e.preventDefault();
    const name = document.getElementById('prof-name').value.trim();
    const phone = document.getElementById('prof-phone').value.trim();
    const designation = document.getElementById('prof-designation').value.trim();

    try {
        const res = await apiRequest('/api/auth/profile', 'PUT', { name, phone, designation });
        setCurrentUser(res.user);
        updateUserHeaderUI(res.user);
        showToast('Profile updated successfully!', 'success');
        closeModal('modal-user-profile');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function submitPasswordChange(e) {
    e.preventDefault();
    const current_password = document.getElementById('pw-current').value;
    const new_password = document.getElementById('pw-new').value;

    try {
        await apiRequest('/api/auth/change-password', 'PUT', { current_password, new_password });
        showToast('Password changed successfully!', 'success');
        document.getElementById('pw-current').value = '';
        document.getElementById('pw-new').value = '';
        closeModal('modal-user-profile');
    } catch (err) {
        showToast(err.message, 'error');
    }
}
