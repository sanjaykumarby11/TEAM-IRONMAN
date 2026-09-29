import { apiRequest } from './api.js';

export async function fetchLeaveBalances() {
    return await apiRequest('/api/leave/balances', 'GET');
}

export async function fetchMyLeaveHistory() {
    return await apiRequest('/api/leave/my-requests', 'GET');
}

export async function submitLeaveApplication(payload) {
    return await apiRequest('/api/leave/apply', 'POST', payload);
}

export async function fetchAllLeaves(status = 'all') {
    return await apiRequest(`/api/leave/all?status=${status}`, 'GET');
}

export async function reviewLeaveRequest(leaveId, status, comments) {
    return await apiRequest(`/api/leave/${leaveId}/review`, 'PUT', { status, comments });
}

export async function cancelLeaveRequest(leaveId) {
    return await apiRequest(`/api/leave/${leaveId}/cancel`, 'POST');
}
