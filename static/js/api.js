/* API Fetch Wrapper and UI Notification Utilities */

const API_BASE_URL = '';

function getAuthToken() {
    return localStorage.getItem('emp_auth_token') || '';
}

function setAuthToken(token) {
    if (token) {
        localStorage.setItem('emp_auth_token', token);
    } else {
        localStorage.removeItem('emp_auth_token');
    }
}

function getCurrentUser() {
    const raw = localStorage.getItem('emp_user_data');
    return raw ? JSON.parse(raw) : null;
}

function setCurrentUser(user) {
    if (user) {
        localStorage.setItem('emp_user_data', JSON.stringify(user));
    } else {
        localStorage.removeItem('emp_user_data');
    }
}

async function apiRequest(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json'
    };

    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                // Unauthorized - clear token and open auth modal if not logging in
                if (!endpoint.includes('/auth/login')) {
                    showToast('Session expired. Please log in again.', 'warning');
                    logout();
                }
            }
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (err) {
        console.error(`API Error [${method} ${endpoint}]:`, err.message);
        throw err;
    }
}

/* Toast Notifications */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle text-emerald';
    else if (type === 'error') iconClass = 'fa-exclamation-triangle text-rose';
    else if (type === 'warning') iconClass = 'fa-triangle-exclamation text-amber';

    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
