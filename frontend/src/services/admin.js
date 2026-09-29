import { apiRequest } from './api.js';

export async function fetchEmployees() {
    return await apiRequest('/api/employees', 'GET');
}

export async function createEmployee(payload) {
    return await apiRequest('/api/employees', 'POST', payload);
}

export async function updateEmployee(userId, payload) {
    return await apiRequest(`/api/employees/${userId}`, 'PUT', payload);
}

export async function fetchAnalytics() {
    return await apiRequest('/api/analytics/dashboard', 'GET');
}

export async function fetchNotifications() {
    return await apiRequest('/api/notifications', 'GET');
}

export async function markNotificationRead(notifId) {
    return await apiRequest(`/api/notifications/${notifId}/read`, 'PUT');
}

export async function markAllNotificationsRead() {
    return await apiRequest('/api/notifications/read-all', 'PUT');
}
