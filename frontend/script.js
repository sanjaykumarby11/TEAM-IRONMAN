const authView = document.getElementById("authView");
const mainApp = document.getElementById("mainApp");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginError = document.getElementById("loginError");
const registerError = document.getElementById("registerError");
const leaveForm = document.getElementById("leaveForm");
const leaveError = document.getElementById("leaveError");
const leaveSuccess = document.getElementById("leaveSuccess");
const historyFilter = document.getElementById("historyFilter");
const leaveHistoryBody = document.getElementById("leaveHistoryBody");
const historyEmpty = document.getElementById("historyEmpty");
const managerTableBody = document.getElementById("managerTableBody");
const managerEmpty = document.getElementById("managerEmpty");
const teamAvailabilityBody = document.getElementById("teamAvailabilityBody");
const teamAvailabilityEmpty = document.getElementById("teamAvailabilityEmpty");
const profileForm = document.getElementById("profileForm");
const profileError = document.getElementById("profileError");
const profileSuccess = document.getElementById("profileSuccess");
const userName = document.getElementById("userName");
const userRole = document.getElementById("userRole");
const managerNav = document.getElementById("managerNav");
const adminNav = document.getElementById("adminNav");
const adminTableBody = document.getElementById("adminTableBody");
const adminError = document.getElementById("adminError");
const adminSuccess = document.getElementById("adminSuccess");
const adminEmpty = document.getElementById("adminEmpty");

const state = {
  token: localStorage.getItem("employeeLeaveToken") || "",
  user: JSON.parse(localStorage.getItem("employeeLeaveUser") || "null"),
  activeView: "dashboard"
};

function setError(element, message) {
  element.textContent = message || "";
}

function setSuccess(element, message) {
  element.textContent = message || "";
}

function roleLabel(role) {
  return role === "admin" ? "Administrator" : role === "manager" ? "Manager" : "Employee";
}

function saveSession(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem("employeeLeaveToken", token);
  localStorage.setItem("employeeLeaveUser", JSON.stringify(user));
}

function clearSession() {
  state.token = "";
  state.user = null;
  localStorage.removeItem("employeeLeaveToken");
  localStorage.removeItem("employeeLeaveUser");
}

function getHeaders(includeFormData = false) {
  const headers = {};
  if (!includeFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }
  return headers;
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(options.formData),
      ...options.headers
    }
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof data === "object" ? data.message : "Request failed.";
    throw new Error(message);
  }

  return data;
}

function showAuthView() {
  authView.classList.remove("hidden");
  mainApp.classList.add("hidden");
}

function showMainApp() {
  authView.classList.add("hidden");
  mainApp.classList.remove("hidden");
}

function setActiveView(viewName) {
  if (viewName === "manager" && !["manager", "admin"].includes(state.user?.role)) return;
  if (viewName === "admin" && state.user?.role !== "admin") return;
  state.activeView = viewName;
  document.querySelectorAll(".view-section").forEach((section) => section.classList.add("hidden"));
  document.getElementById(`${viewName}View`).classList.remove("hidden");
  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
}

async function loadDashboard() {
  const dashboard = await apiRequest("/api/dashboard");
  document.getElementById("totalLeave").textContent = dashboard.totalLeave;
  document.getElementById("usedLeave").textContent = dashboard.usedLeave;
  document.getElementById("remainingLeave").textContent = dashboard.remainingLeave;
  document.getElementById("pendingRequests").textContent = dashboard.pendingRequests;
}

function formatDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-GB");
}

function statusClass(status) {
  return status.toLowerCase();
}

async function loadLeaveHistory() {
  const leaves = await apiRequest(`/api/leaves?status=${historyFilter.value}`);
  leaveHistoryBody.innerHTML = "";
  leaves.forEach((leave) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${leave.leave_type}</td>
      <td>${formatDate(leave.from_date)}</td>
      <td>${formatDate(leave.to_date)}</td>
      <td>${leave.reason}</td>
      <td><span class="status-badge ${statusClass(leave.status)}">${leave.status}</span></td>
    `;
    leaveHistoryBody.appendChild(row);
  });
  historyEmpty.classList.toggle("hidden", leaves.length > 0);
}

async function loadProfile() {
  const profile = await apiRequest("/api/profile");
  document.getElementById("profileName").value = profile.name;
  document.getElementById("profileEmployeeId").value = profile.employee_id;
  document.getElementById("profileEmail").value = profile.email;
  document.getElementById("profileDepartment").value = profile.department;
  document.getElementById("profilePhone").value = profile.phone;
}

async function loadManagerLeaves() {
  const leaves = await apiRequest("/api/manager/leaves");
  managerTableBody.innerHTML = "";
  leaves.forEach((leave) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${leave.employee_name}</td>
      <td>${leave.employee_id}</td>
      <td>${leave.leave_type}</td>
      <td>${formatDate(leave.from_date)}</td>
      <td>${formatDate(leave.to_date)}</td>
      <td>${leave.reason}</td>
      <td><span class="status-badge pending">${leave.status}</span></td>
      <td>
        <div class="manager-actions">
          <button class="approve-btn" data-action="approve" data-id="${leave.id}" type="button">Approve</button>
          <button class="reject-btn" data-action="reject" data-id="${leave.id}" type="button">Reject</button>
        </div>
      </td>
    `;
    managerTableBody.appendChild(row);
  });
  managerEmpty.classList.toggle("hidden", leaves.length > 0);
}

async function loadManagerTeam() {
  const { team } = await apiRequest("/api/manager/team");
  teamAvailabilityBody.replaceChildren();

  team.forEach((employee) => {
    const row = document.createElement("tr");
    const identity = document.createElement("td");
    identity.textContent = `${employee.name} (${employee.employeeId})`;

    const department = document.createElement("td");
    department.textContent = employee.department;

    const email = document.createElement("td");
    email.textContent = employee.email;

    const phone = document.createElement("td");
    phone.textContent = employee.phone;

    const availability = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "status-badge";
    if (["On leave", "Upcoming leave"].includes(employee.availability)) badge.classList.add("approved");
    if (employee.availability === "Pending request") badge.classList.add("pending");
    badge.textContent = employee.availability;
    availability.appendChild(badge);

    const pending = document.createElement("td");
    pending.textContent = String(employee.pendingRequests.length);

    const absence = document.createElement("td");
    const currentAbsence = employee.approvedAbsences.find((leave) => {
      const today = new Date().toISOString().slice(0, 10);
      return leave.fromDate <= today && leave.toDate >= today;
    });
    const nextAbsence = currentAbsence || employee.upcomingAbsence;
    absence.textContent = nextAbsence
      ? `${nextAbsence.leaveType}: ${formatDate(nextAbsence.fromDate)} - ${formatDate(nextAbsence.toDate)}`
      : "None scheduled";

    row.append(identity, department, email, phone, availability, pending, absence);
    teamAvailabilityBody.appendChild(row);
  });

  teamAvailabilityEmpty.classList.toggle("hidden", team.length > 0);
}

async function loadAdminEmployees() {
  const data = await apiRequest("/api/admin/employees");
  adminTableBody.replaceChildren();

  data.employees.forEach((employee) => {
    const row = document.createElement("tr");
    const isSelf = employee.id === state.user.id;
    const nameCell = document.createElement("td");
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.dataset.field = "name";
    nameInput.value = employee.name;
    nameInput.disabled = isSelf;
    nameCell.appendChild(nameInput);

    const idCell = document.createElement("td");
    idCell.textContent = employee.employee_id;

    const emailCell = document.createElement("td");
    const emailInput = document.createElement("input");
    emailInput.type = "email";
    emailInput.dataset.field = "email";
    emailInput.value = employee.email;
    emailInput.disabled = isSelf;
    emailCell.appendChild(emailInput);

    const departmentCell = document.createElement("td");
    const departmentInput = document.createElement("input");
    departmentInput.type = "text";
    departmentInput.dataset.field = "department";
    departmentInput.value = employee.department;
    departmentInput.disabled = isSelf;
    departmentCell.appendChild(departmentInput);

    const phoneCell = document.createElement("td");
    const phoneInput = document.createElement("input");
    phoneInput.type = "tel";
    phoneInput.dataset.field = "phone";
    phoneInput.value = employee.phone;
    phoneInput.disabled = isSelf;
    phoneCell.appendChild(phoneInput);

    const roleCell = document.createElement("td");
    const roleSelect = document.createElement("select");
    roleSelect.dataset.field = "role";
    ["employee", "manager", "admin"].forEach((role) => {
      const option = document.createElement("option");
      option.value = role;
      option.textContent = roleLabel(role);
      roleSelect.appendChild(option);
    });
    roleSelect.value = employee.role;
    roleSelect.disabled = isSelf;
    roleCell.appendChild(roleSelect);

    const managerCell = document.createElement("td");
    const managerSelect = document.createElement("select");
    managerSelect.dataset.field = "manager";
    const unassigned = document.createElement("option");
    unassigned.value = "";
    unassigned.textContent = "Unassigned";
    managerSelect.appendChild(unassigned);
    data.managers.forEach((manager) => {
      const option = document.createElement("option");
      option.value = manager.id;
      option.textContent = `${manager.name} (${manager.employee_id})`;
      managerSelect.appendChild(option);
    });
    managerSelect.value = employee.manager_id || "";
    managerSelect.disabled = employee.role !== "employee" || isSelf;
    roleSelect.addEventListener("change", () => {
      managerSelect.disabled = roleSelect.value !== "employee" || isSelf;
    });
    managerCell.appendChild(managerSelect);

    const actionCell = document.createElement("td");
    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "secondary-btn";
    saveButton.textContent = "Save";
    saveButton.dataset.employeeId = employee.id;
    saveButton.disabled = isSelf;
    actionCell.appendChild(saveButton);

    row.append(nameCell, idCell, emailCell, departmentCell, phoneCell, roleCell, managerCell, actionCell);
    adminTableBody.appendChild(row);
  });

  adminEmpty.classList.toggle("hidden", data.employees.length > 0);
}

async function updateEmployeeAccess(button) {
  setError(adminError, "");
  setSuccess(adminSuccess, "");
  const row = button.closest("tr");

  try {
    const response = await apiRequest(`/api/admin/employees/${button.dataset.employeeId}`, {
      method: "PUT",
      body: JSON.stringify({
        name: row.querySelector('[data-field="name"]').value,
        email: row.querySelector('[data-field="email"]').value,
        department: row.querySelector('[data-field="department"]').value,
        phone: row.querySelector('[data-field="phone"]').value,
        role: row.querySelector('[data-field="role"]').value,
        managerId: row.querySelector('[data-field="manager"]').value
      })
    });
    setSuccess(adminSuccess, response.message);
    await loadAdminEmployees();
  } catch (error) {
    setError(adminError, error.message);
  }
}

async function updateManagerLeave(id, status) {
  const response = await apiRequest(`/api/manager/leaves/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status, managerComment: "" })
  });
  setSuccess(document.getElementById("managerEmpty"), response.message);
  await Promise.all([loadManagerLeaves(), loadManagerTeam()]);
  await loadDashboard();
}

async function initializeApp() {
  if (!state.token || !state.user) {
    showAuthView();
    return;
  }

  userName.textContent = state.user.name;
  userRole.textContent = roleLabel(state.user.role);
  managerNav.classList.toggle("hidden", !["manager", "admin"].includes(state.user.role));
  adminNav.classList.toggle("hidden", state.user.role !== "admin");
  showMainApp();
  setActiveView("dashboard");

  try {
    await Promise.all([
      loadDashboard(),
      loadLeaveHistory(),
      loadProfile(),
      ["manager", "admin"].includes(state.user.role) ? Promise.all([loadManagerTeam(), loadManagerLeaves()]) : Promise.resolve(),
      state.user.role === "admin" ? loadAdminEmployees() : Promise.resolve()
    ]);
  } catch (error) {
    clearSession();
    showAuthView();
    setError(loginError, error.message);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  setError(loginError, "");

  try {
    const formData = new FormData(loginForm);
    const response = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        identifier: formData.get("identifier"),
        password: formData.get("password")
      })
    });

    saveSession(response.token, response.user);
    userName.textContent = response.user.name;
    userRole.textContent = roleLabel(response.user.role);
    managerNav.classList.toggle("hidden", !["manager", "admin"].includes(response.user.role));
    adminNav.classList.toggle("hidden", response.user.role !== "admin");
    showMainApp();
    setActiveView("dashboard");
    await initializeApp();
  } catch (error) {
    setError(loginError, error.message);
  }
}

async function handleRegister(event) {
  event.preventDefault();
  setError(registerError, "");

  try {
    const formData = new FormData(registerForm);
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });

    setError(registerError, "");
    registerForm.reset();
    document.querySelector('[data-auth="login"]').click();
  } catch (error) {
    setError(registerError, error.message);
  }
}

async function handleLeaveSubmit(event) {
  event.preventDefault();
  setError(leaveError, "");
  setSuccess(leaveSuccess, "");

  try {
    const formData = new FormData(leaveForm);
    const fromDate = formData.get("fromDate");
    const toDate = formData.get("toDate");
    if (toDate < fromDate) {
      throw new Error("To date must be the same as or after the From date.");
    }

    const response = await fetch("/api/leaves", {
      method: "POST",
      headers: { Authorization: `Bearer ${state.token}` },
      body: formData
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "Unable to submit leave request.");
    }

    leaveForm.reset();
    document.getElementById("leaveDays").value = "0";
    setSuccess(leaveSuccess, data.message);
    await loadDashboard();
    await loadLeaveHistory();
  } catch (error) {
    setError(leaveError, error.message);
  }
}

async function handleProfileUpdate(event) {
  event.preventDefault();
  setError(profileError, "");
  setSuccess(profileSuccess, "");

  try {
    const formData = new FormData(profileForm);
    const response = await apiRequest("/api/profile", {
      method: "PUT",
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });
    state.user.name = formData.get("name");
    localStorage.setItem("employeeLeaveUser", JSON.stringify(state.user));
    userName.textContent = state.user.name;
    setSuccess(profileSuccess, response.message);
  } catch (error) {
    setError(profileError, error.message);
  }
}

function handleAuthToggle(event) {
  const target = event.target.closest(".toggle-btn");
  if (!target) return;
  const isLogin = target.dataset.auth === "login";
  document.querySelectorAll(".toggle-btn").forEach((button) => button.classList.toggle("active", button === target));
  loginForm.classList.toggle("hidden", !isLogin);
  registerForm.classList.toggle("hidden", isLogin);
  setError(loginError, "");
  setError(registerError, "");
}

function updateLeaveDays() {
  const fromDate = document.getElementById("fromDate").value;
  const toDate = document.getElementById("toDate").value;
  const dayCount = fromDate && toDate ? Math.max(1, Math.round((new Date(`${toDate}T00:00:00`) - new Date(`${fromDate}T00:00:00`)) / 86400000) + 1) : 0;
  document.getElementById("leaveDays").value = dayCount;
}

function attachEventListeners() {
  loginForm.addEventListener("submit", handleLogin);
  registerForm.addEventListener("submit", handleRegister);
  leaveForm.addEventListener("submit", handleLeaveSubmit);
  profileForm.addEventListener("submit", handleProfileUpdate);
  historyFilter.addEventListener("change", loadLeaveHistory);
  document.querySelectorAll(".toggle-btn").forEach((button) => button.addEventListener("click", handleAuthToggle));
  document.querySelectorAll(".nav-btn").forEach((button) => button.addEventListener("click", () => {
    setActiveView(button.dataset.view);
  }));
  adminTableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-employee-id]");
    if (button) updateEmployeeAccess(button);
  });
  document.getElementById("logoutBtn").addEventListener("click", () => {
    clearSession();
    showAuthView();
    loginForm.reset();
    registerForm.reset();
  });
  document.getElementById("fromDate").addEventListener("change", updateLeaveDays);
  document.getElementById("toDate").addEventListener("change", updateLeaveDays);
  document.addEventListener("click", async (event) => {
    const button = event.target.closest(".approve-btn, .reject-btn");
    if (!button) return;
    const action = button.dataset.action;
    const id = Number(button.dataset.id);
    await updateManagerLeave(id, action === "approve" ? "Approved" : "Rejected");
  });
}

attachEventListeners();
initializeApp();
