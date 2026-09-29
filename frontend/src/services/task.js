import { apiRequest } from './api.js';

export async function fetchTasks(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return await apiRequest(`/api/tasks?${query}`, 'GET');
}

export async function createNewTask(payload) {
    return await apiRequest('/api/tasks', 'POST', payload);
}

export async function fetchTaskDetails(taskId) {
    return await apiRequest(`/api/tasks/${taskId}`, 'GET');
}

export async function updateTaskStatusProgress(taskId, status, progressPercent) {
    return await apiRequest(`/api/tasks/${taskId}/status`, 'PUT', { status, progress_percent: progressPercent });
}

export async function updateTaskDetails(taskId, payload) {
    return await apiRequest(`/api/tasks/${taskId}`, 'PUT', payload);
}

export async function deleteTask(taskId) {
    return await apiRequest(`/api/tasks/${taskId}`, 'DELETE');
}

export async function addTaskComment(taskId, comment) {
    return await apiRequest(`/api/tasks/${taskId}/comments`, 'POST', { comment });
}
