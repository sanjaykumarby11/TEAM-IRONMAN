import { apiRequest, setAuthToken, setCurrentUser } from './api.js';

export async function loginUser(email, password) {
    const data = await apiRequest('/api/auth/login', 'POST', { email, password });
    if (data.token) {
        setAuthToken(data.token);
        setCurrentUser(data.user);
    }
    return data;
}

export async function registerUser(payload) {
    return await apiRequest('/api/auth/register', 'POST', payload);
}

export async function fetchCurrentUser() {
    return await apiRequest('/api/auth/me', 'GET');
}

export async function updateProfile(payload) {
    const data = await apiRequest('/api/auth/profile', 'PUT', payload);
    if (data.user) {
        setCurrentUser(data.user);
    }
    return data;
}

export async function changePassword(payload) {
    return await apiRequest('/api/auth/change-password', 'PUT', payload);
}

export function logoutUser() {
    setAuthToken(null);
    setCurrentUser(null);
}
