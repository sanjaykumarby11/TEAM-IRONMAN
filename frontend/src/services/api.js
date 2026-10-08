const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Cannot reach the server. Check that the backend is running.");
  }
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const detail = data?.detail;
    throw new Error(
      Array.isArray(detail)
        ? detail.map((item) => item.msg).join(" ")
        : detail || "The request could not be completed.",
    );
  }
  return data;
}

export const api = {
  getTasks: () => request("/tasks"),
  getTask: (id) => request(`/tasks/${id}`),
  createTask: (task) =>
    request("/tasks", { method: "POST", body: JSON.stringify(task) }),
  updateTask: (id, task) =>
    request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(task) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
  updateStatus: (id, status) =>
    request(`/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  getEmployees: () => request("/employees"),
  getDashboard: (employeeId) =>
    request(`/dashboard${employeeId ? `?employee_id=${employeeId}` : ""}`),
};
