/* Task Management Module Frontend Logic */

let currentTasks = [];
let activeTaskView = 'kanban';
let selectedTaskForModal = null;
let selectedTaskStatusChoice = 'to_do';

async function loadTasks() {
    try {
        const priority = document.getElementById('filter-task-priority').value;
        const scope = document.getElementById('filter-task-scope').value;

        const res = await apiRequest(`/api/tasks?priority=${priority}&scope=${scope}`);
        currentTasks = res.tasks;
        renderTasksView();
        renderDashboardRecentTasks();
    } catch (err) {
        console.error("Error loading tasks:", err);
    }
}

function filterTasksLocal() {
    renderTasksView();
}

function switchTaskView(view) {
    activeTaskView = view;
    const btnKanban = document.getElementById('btn-view-kanban');
    const btnList = document.getElementById('btn-view-list');
    const kanbanView = document.getElementById('task-view-kanban');
    const listView = document.getElementById('task-view-list');

    if (view === 'kanban') {
        btnKanban.classList.add('active');
        btnList.classList.remove('active');
        kanbanView.classList.remove('hidden');
        listView.classList.add('hidden');
    } else {
        btnList.classList.add('active');
        btnKanban.classList.remove('active');
        listView.classList.remove('hidden');
        kanbanView.classList.add('hidden');
    }

    renderTasksView();
}

function renderTasksView() {
    const searchTerm = (document.getElementById('filter-task-search')?.value || '').toLowerCase();
    
    let filtered = currentTasks;
    if (searchTerm) {
        filtered = filtered.filter(t => 
            t.title.toLowerCase().includes(searchTerm) || 
            t.assignee_name.toLowerCase().includes(searchTerm) ||
            t.department.toLowerCase().includes(searchTerm)
        );
    }

    if (activeTaskView === 'kanban') {
        renderKanbanBoard(filtered);
    } else {
        renderTaskListTable(filtered);
    }
}

function renderKanbanBoard(tasks) {
    const cols = ['to_do', 'in_progress', 'in_review', 'completed'];

    cols.forEach(colStatus => {
        const container = document.getElementById(`kanban-body-${colStatus}`);
        const countBadge = document.getElementById(`count-${colStatus === 'to_do' ? 'todo' : (colStatus === 'in_progress' ? 'progress' : (colStatus === 'in_review' ? 'review' : 'completed'))}`);
        
        if (!container) return;

        const colTasks = tasks.filter(t => t.status === colStatus);
        if (countBadge) countBadge.textContent = colTasks.length;

        if (colTasks.length === 0) {
            container.innerHTML = `<div class="empty-state p-3 text-muted text-center">No tasks</div>`;
            return;
        }

        container.innerHTML = colTasks.map(t => `
            <div class="kanban-card" onclick="openTaskDetailsModal(${t.id})">
                <div class="display-flex justify-between align-center">
                    <span class="badge badge-${getPriorityBadgeClass(t.priority)}">${t.priority}</span>
                    <span style="font-size: 11px;" class="text-muted"><i class="fa-solid fa-clock"></i> ${t.due_date}</span>
                </div>
                <div class="card-title">${t.title}</div>
                
                <div class="progress-bar" style="margin: 4px 0;">
                    <div class="progress-fill fill-${t.progress_percent === 100 ? 'emerald' : 'violet'}" style="width: ${t.progress_percent}%;"></div>
                </div>
                
                <div class="card-meta">
                    <div class="card-assignee">
                        <img src="${t.assignee_avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + t.assignee_name}" class="user-avatar-xs">
                        <span>${t.assignee_name}</span>
                    </div>
                    <span><strong>${t.progress_percent}%</strong></span>
                </div>
            </div>
        `).join('');
    });
}

function renderTaskListTable(tasks) {
    const tbody = document.getElementById('task-list-tbody');
    if (!tbody) return;

    if (tasks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-muted">No tasks found.</td></tr>`;
        return;
    }

    tbody.innerHTML = tasks.map(t => `
        <tr>
            <td>
                <strong>${t.title}</strong>
                <div style="font-size: 11px;" class="text-muted">${t.department}</div>
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <img src="${t.assignee_avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + t.assignee_name}" class="user-avatar-xs">
                    <span>${t.assignee_name}</span>
                </div>
            </td>
            <td><span class="badge badge-${getPriorityBadgeClass(t.priority)}">${t.priority}</span></td>
            <td><span class="badge badge-secondary">${formatStatusLabel(t.status)}</span></td>
            <td style="width: 140px;">
                <div class="progress-bar">
                    <div class="progress-fill fill-${t.progress_percent === 100 ? 'emerald' : 'violet'}" style="width: ${t.progress_percent}%;"></div>
                </div>
                <small>${t.progress_percent}% Complete</small>
            </td>
            <td>${t.due_date}</td>
            <td>
                <button type="button" class="btn btn-primary btn-sm" onclick="openTaskDetailsModal(${t.id})">
                    <i class="fa-solid fa-folder-open"></i> Manage
                </button>
            </td>
        </tr>
    `).join('');
}

function renderDashboardRecentTasks() {
    const container = document.getElementById('dash-recent-tasks');
    const statActive = document.getElementById('stat-active-tasks');

    const activeTasks = currentTasks.filter(t => t.status !== 'completed');
    if (statActive) statActive.textContent = `${activeTasks.length} Active`;

    if (!container) return;

    if (currentTasks.length === 0) {
        container.innerHTML = `<div class="empty-state">No assigned tasks found.</div>`;
        return;
    }

    const recent = currentTasks.slice(0, 4);
    container.innerHTML = recent.map(t => `
        <div class="card-item glassmorphic p-3 margin-bottom-xs cursor-pointer" onclick="openTaskDetailsModal(${t.id})">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="font-size: 13px;">${t.title}</strong>
                <span class="badge badge-${getPriorityBadgeClass(t.priority)}">${t.priority}</span>
            </div>
            <div style="margin-top: 6px; display: flex; justify-content: space-between; font-size: 11px;" class="text-muted">
                <span>Assignee: ${t.assignee_name}</span>
                <span>Due: ${t.due_date}</span>
            </div>
        </div>
    `).join('');
}

function getPriorityBadgeClass(priority) {
    if (priority === 'urgent') return 'danger';
    if (priority === 'high') return 'warning';
    if (priority === 'medium') return 'primary';
    return 'secondary';
}

function formatStatusLabel(st) {
    return st.replace('_', ' ').toUpperCase();
}

/* CREATE TASK MODAL */

async function openCreateTaskModal() {
    // Populate Assignee Select Options
    try {
        const res = await apiRequest('/api/employees');
        const select = document.getElementById('task-assignee-select');
        select.innerHTML = res.employees.map(e => `
            <option value="${e.id}">${e.name} (${e.department} - ${e.designation})</option>
        `).join('');

        // Set default due date to 7 days from now
        const defaultDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        document.getElementById('task-duedate-input').value = defaultDue;

        openModal('modal-create-task');
    } catch (err) {
        showToast("Error loading employee list for assignment.", 'error');
    }
}

async function submitCreateTask(e) {
    e.preventDefault();
    const title = document.getElementById('task-title-input').value.trim();
    const description = document.getElementById('task-desc-input').value.trim();
    const assigned_to = document.getElementById('task-assignee-select').value;
    const priority = document.getElementById('task-priority-select').value;
    const due_date = document.getElementById('task-duedate-input').value;
    const department = document.getElementById('task-dept-input').value;

    try {
        await apiRequest('/api/tasks', 'POST', {
            title, description, assigned_to, priority, due_date, department
        });
        showToast('Task created and assigned successfully!', 'success');
        closeModal('modal-create-task');
        loadTasks();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

/* TASK DETAILS & STATUS MODAL */

async function openTaskDetailsModal(taskId) {
    try {
        const res = await apiRequest(`/api/tasks/${taskId}`);
        selectedTaskForModal = res.task;

        document.getElementById('task-detail-title').textContent = selectedTaskForModal.title;
        document.getElementById('task-detail-desc').textContent = selectedTaskForModal.description || 'No description provided.';
        document.getElementById('task-detail-assignee').textContent = selectedTaskForModal.assignee_name;
        document.getElementById('task-detail-creator').textContent = selectedTaskForModal.creator_name;
        document.getElementById('task-detail-duedate').textContent = selectedTaskForModal.due_date;

        const badgePrio = document.getElementById('task-detail-priority-badge');
        badgePrio.className = `badge badge-${getPriorityBadgeClass(selectedTaskForModal.priority)}`;
        badgePrio.textContent = selectedTaskForModal.priority;

        // Set Status & Slider
        selectTaskStatus(selectedTaskForModal.status);
        const slider = document.getElementById('task-progress-slider');
        slider.value = selectedTaskForModal.progress_percent;
        document.getElementById('slider-percent-val').textContent = `${selectedTaskForModal.progress_percent}%`;

        // Comments thread
        renderTaskComments(res.comments);

        openModal('modal-task-details');
    } catch (err) {
        showToast("Failed to load task details.", 'error');
    }
}

function selectTaskStatus(st) {
    selectedTaskStatusChoice = st;
    const btns = ['to_do', 'in_progress', 'in_review', 'completed'];

    btns.forEach(b => {
        const el = document.getElementById(`btn-status-${b}`);
        if (el) {
            if (b === st) el.classList.add('active');
            else el.classList.remove('active');
        }
    });

    if (st === 'completed') {
        updateSliderVal(100);
        document.getElementById('task-progress-slider').value = 100;
    }
}

function updateSliderVal(val) {
    document.getElementById('slider-percent-val').textContent = `${val}%`;
    if (parseInt(val) === 100 && selectedTaskStatusChoice !== 'completed') {
        selectTaskStatus('completed');
    }
}

async function saveTaskStatusUpdate() {
    if (!selectedTaskForModal) return;

    const progress_percent = parseInt(document.getElementById('task-progress-slider').value);
    const status = selectedTaskStatusChoice;

    try {
        await apiRequest(`/api/tasks/${selectedTaskForModal.id}/status`, 'PUT', {
            status, progress_percent
        });
        showToast('Task progress saved!', 'success');
        closeModal('modal-task-details');
        loadTasks();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderTaskComments(comments) {
    const container = document.getElementById('task-comments-list');
    if (!container) return;

    if (!comments || comments.length === 0) {
        container.innerHTML = `<div class="empty-state text-muted" style="font-size: 12px;">No comments posted yet.</div>`;
        return;
    }

    container.innerHTML = comments.map(c => `
        <div class="comment-card">
            <img src="${c.author_avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + c.author_name}" class="user-avatar-xs">
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; font-size: 12px;">
                    <strong>${c.author_name} <small class="text-muted">(${c.author_role})</small></strong>
                    <span style="font-size: 10px;" class="text-muted">${c.created_at}</span>
                </div>
                <div style="margin-top: 4px; font-size: 13px;">${c.comment}</div>
            </div>
        </div>
    `).join('');
}

async function submitTaskComment(e) {
    e.preventDefault();
    if (!selectedTaskForModal) return;

    const input = document.getElementById('input-task-comment');
    const comment = input.value.trim();
    if (!comment) return;

    try {
        await apiRequest(`/api/tasks/${selectedTaskForModal.id}/comments`, 'POST', { comment });
        input.value = '';
        
        // Refresh comments
        const res = await apiRequest(`/api/tasks/${selectedTaskForModal.id}`);
        renderTaskComments(res.comments);
        showToast('Comment posted', 'info');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deleteCurrentTask() {
    if (!selectedTaskForModal) return;
    if (!confirm(`Are you sure you want to delete task "${selectedTaskForModal.title}"?`)) return;

    try {
        await apiRequest(`/api/tasks/${selectedTaskForModal.id}`, 'DELETE');
        showToast('Task deleted.', 'info');
        closeModal('modal-task-details');
        loadTasks();
    } catch (err) {
        showToast(err.message, 'error');
    }
}
