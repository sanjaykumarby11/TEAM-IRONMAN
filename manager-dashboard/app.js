let requests = [];
let employees = {};
let tasks = [];
let currentFilter = 'all';
let selectedRequestId = null;

// Calendar State
let calYear = 2026;
let calMonth = 9; // October (0-indexed)
let calView = 'timeline'; // 'timeline' | 'month'

// DOM Elements
const requestListEl = document.getElementById('request-list');
const upcomingListEl = document.getElementById('upcoming-list');
const teamListEl = document.getElementById('team-list');

const pendingCountEl = document.getElementById('pending-count');
const approvedCountEl = document.getElementById('approved-count');
const rejectedCountEl = document.getElementById('rejected-count');
const upcomingCountEl = document.getElementById('upcoming-count');
const upcomingBadgeEl = document.getElementById('upcoming-badge');
const filterBtns = document.querySelectorAll('.filter-btn');

// Calendar DOM Elements
const calPrevMonthBtn = document.getElementById('cal-prev-month');
const calNextMonthBtn = document.getElementById('cal-next-month');
const calTodayBtn = document.getElementById('cal-today-btn');
const calMonthDisplay = document.getElementById('cal-month-display');
const viewTimelineBtn = document.getElementById('view-timeline-btn');
const viewMonthBtn = document.getElementById('view-month-btn');
const calendarTimelineView = document.getElementById('calendar-timeline-view');
const calendarMonthView = document.getElementById('calendar-month-view');
const timelineWrapper = document.getElementById('timeline-wrapper');
const monthGridWrapper = document.getElementById('month-grid-wrapper');
const coverageSummaryBar = document.getElementById('coverage-summary-bar');

// Review Modal Elements
const reviewModal = document.getElementById('review-modal');
const closeModalBtn = document.getElementById('close-modal');
const cancelReviewBtn = document.getElementById('cancel-review-btn');
const approveBtn = document.getElementById('approve-btn');
const rejectBtn = document.getElementById('reject-btn');
const commentsInput = document.getElementById('review-comments');
const modalOverlapAlert = document.getElementById('modal-overlap-alert');
const modalOverlapDesc = document.getElementById('modal-overlap-desc');
const modalBalancesPills = document.getElementById('modal-balances-pills');
const modalHistoryList = document.getElementById('modal-history-list');

// Profile Modal Elements
const profileModal = document.getElementById('profile-modal');
const closeProfileModalBtn = document.getElementById('close-profile-modal');
const closeProfileBtn = document.getElementById('close-profile-btn');

// Task Modal Elements
const taskListEl = document.getElementById('task-list');
const newTaskBtn = document.getElementById('new-task-btn');
const taskModal = document.getElementById('task-modal');
const closeTaskModalBtn = document.getElementById('close-task-modal');
const cancelTaskBtn = document.getElementById('cancel-task-btn');
const taskForm = document.getElementById('task-form');
const taskAssigneeSelect = document.getElementById('task-assignee');
const taskStartInput = document.getElementById('task-start');
const taskEndInput = document.getElementById('task-end');
const taskConflictAlert = document.getElementById('task-conflict-alert');
const taskConflictDesc = document.getElementById('task-conflict-desc');
const assigneeStatusIndicator = document.getElementById('assignee-status-indicator');
const assigneeStatusText = document.getElementById('assignee-status-text');

// Settings Elements
const generalSettingsForm = document.getElementById('general-settings-form');
const accrualPolicySelect = document.getElementById('accrual-policy');
const autoApproveInput = document.getElementById('auto-approve-threshold');
const leaveTypesListEl = document.getElementById('leave-types-list');
const addLeaveTypeBtn = document.getElementById('add-leave-type-btn');

function init() {
    loadData();
    updateStats();
    renderUpcomingAbsences();
    renderTeamEntitlements();
    renderRequests();
    renderTasks();
    renderCalendar();
    renderNotifications();
    renderSettings();
    setupEventListeners();
    
    // Listen for storage changes from employee portal
    window.addEventListener('storage', () => {
        loadData();
        updateStats();
        renderUpcomingAbsences();
        renderTeamEntitlements();
        renderRequests();
        renderTasks();
        renderCalendar();
        
        // Check for new unread notifications and show toast
        const newNotifs = window.DB.getNotifications(null, 'manager').filter(n => !n.read && !n._toastShown);
        newNotifs.forEach(n => {
            showToast(n.message);
            // Mark it so we don't toast twice
            n._toastShown = true;
            window.DB.updateNotificationTemp && window.DB.updateNotificationTemp(n);
        });
        renderNotifications();
    });
}

function loadData() {
    requests = window.DB.getRequests();
    employees = window.DB.getEmployees();
    tasks = window.DB.getTasks();
}

// 1. Render Dashboard Stats
function updateStats() {
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;
    const upcoming = window.DB.getUpcomingAbsences().length;

    animateValue(pendingCountEl, pending);
    animateValue(approvedCountEl, approved);
    animateValue(rejectedCountEl, rejected);
    animateValue(upcomingCountEl, upcoming);
    
    if (upcomingBadgeEl) {
        upcomingBadgeEl.innerText = `${upcoming} Scheduled`;
    }
}

function animateValue(element, newValue) {
    if (!element) return;
    if (element.innerText !== newValue.toString()) {
        element.style.transform = 'scale(1.25)';
        element.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        element.style.color = '#fff';
        setTimeout(() => {
            element.innerText = newValue;
            element.style.transform = 'scale(1)';
            element.style.color = '';
        }, 180);
    }
}

// 2. Render Team Availability & Coverage Calendar
function renderCalendar() {
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    if (calMonthDisplay) {
        calMonthDisplay.innerText = `${monthNames[calMonth]} ${calYear}`;
    }

    const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
    const today = new Date().toISOString().split('T')[0];
    const empList = Object.values(employees);
    const totalStaff = empList.length;

    // Get all requests active in this month
    const monthLeaves = window.DB.getLeavesForMonth(calYear, calMonth);

    // Compute day-by-day staffing capacity
    let fullCoverageDays = 0;
    let reducedCoverageDays = 0;
    let totalAvailableRatioSum = 0;

    const dayAvailability = []; // 1-indexed

    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayLeaves = monthLeaves.filter(r => r.startDate <= dateStr && r.endDate >= dateStr);
        const approvedLeaves = dayLeaves.filter(r => r.status === 'approved');
        const pendingLeaves = dayLeaves.filter(r => r.status === 'pending');

        const awayStaffCount = approvedLeaves.length;
        const availableStaff = Math.max(0, totalStaff - awayStaffCount);

        dayAvailability[day] = {
            dateStr,
            availableStaff,
            totalStaff,
            dayLeaves,
            approvedLeaves,
            pendingLeaves
        };

        if (availableStaff === totalStaff) {
            fullCoverageDays++;
        } else {
            reducedCoverageDays++;
        }
        totalAvailableRatioSum += (availableStaff / totalStaff);
    }

    const avgCoveragePct = Math.round((totalAvailableRatioSum / totalDays) * 100);

    // Render Coverage Health Summary
    if (coverageSummaryBar) {
        coverageSummaryBar.innerHTML = `
            <div class="coverage-metric-card">
                <div class="coverage-metric-icon">🗓️</div>
                <div class="coverage-metric-info">
                    <h4>Days in Month</h4>
                    <p>${totalDays} Days</p>
                </div>
            </div>
            <div class="coverage-metric-card">
                <div class="coverage-metric-icon">🛡️</div>
                <div class="coverage-metric-info">
                    <h4>Full Coverage (100%)</h4>
                    <p class="metric-green">${fullCoverageDays} Days</p>
                </div>
            </div>
            <div class="coverage-metric-card">
                <div class="coverage-metric-icon">⚠️</div>
                <div class="coverage-metric-info">
                    <h4>Reduced Coverage</h4>
                    <p class="${reducedCoverageDays > 0 ? 'metric-amber' : 'metric-green'}">${reducedCoverageDays} Days</p>
                </div>
            </div>
            <div class="coverage-metric-card">
                <div class="coverage-metric-icon">📈</div>
                <div class="coverage-metric-info">
                    <h4>Avg Team Availability</h4>
                    <p class="metric-cyan">${avgCoveragePct}%</p>
                </div>
            </div>
        `;
    }

    // Render Timeline Matrix View
    if (calView === 'timeline') {
        renderTimelineMatrix(totalDays, today, empList, monthLeaves, dayAvailability);
    } else {
        renderMonthGrid(totalDays, today, monthLeaves, dayAvailability);
    }
}

function renderTimelineMatrix(totalDays, today, empList, monthLeaves, dayAvailability) {
    if (!timelineWrapper) return;
    
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    let html = `
        <table class="timeline-table">
            <thead>
                <tr>
                    <th class="timeline-th-emp">Team Member</th>
    `;

    for (let day = 1; day <= totalDays; day++) {
        const d = new Date(calYear, calMonth, day);
        const dayOfWeek = d.getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = (dateStr === today);

        html += `
            <th class="timeline-th-day ${isWeekend ? 'is-weekend' : ''} ${isToday ? 'is-today' : ''}" title="${dateStr}">
                <span class="day-num">${day}</span>
                <span class="day-name">${dayNames[dayOfWeek]}</span>
            </th>
        `;
    }
    html += `</tr></thead><tbody>`;

    // Team Capacity Indicator Row
    html += `
        <tr class="timeline-row-capacity">
            <td class="timeline-capacity-label">Daily Available Staff</td>
    `;
    for (let day = 1; day <= totalDays; day++) {
        const info = dayAvailability[day];
        let badgeClass = 'cap-full';
        if (info.availableStaff < info.totalStaff) {
            badgeClass = info.availableStaff <= 1 ? 'cap-critical' : 'cap-reduced';
        }
        html += `
            <td class="timeline-capacity-cell" title="${info.dateStr}: ${info.availableStaff}/${info.totalStaff} team members available">
                <span class="cap-badge ${badgeClass}">${info.availableStaff}/${info.totalStaff}</span>
            </td>
        `;
    }
    html += `</tr>`;

    // Rows for each employee
    empList.forEach(emp => {
        html += `
            <tr class="timeline-row-emp">
                <td class="timeline-td-emp">
                    <div class="emp-matrix-card">
                        <img src="${emp.avatar}" alt="${emp.name}" class="avatar">
                        <div class="emp-matrix-info">
                            <div class="emp-m-name">${emp.name}</div>
                            <div class="emp-m-role">${emp.role}</div>
                        </div>
                    </div>
                </td>
        `;

        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const d = new Date(calYear, calMonth, day);
            const isWeekend = (d.getDay() === 0 || d.getDay() === 6);
            const isToday = (dateStr === today);

            // Check if this employee has leave on this day
            const leave = monthLeaves.find(r => r.employeeId == emp.id && r.startDate <= dateStr && r.endDate >= dateStr && r.status !== 'rejected');

            let leaveContent = '';
            if (leave) {
                const leaveTypeClass = getLeaveTypeClass(leave.type, leave.status);
                const titleText = `${emp.name} - ${leave.type} (${leave.status})\nDates: ${formatDate(leave.startDate)} to ${formatDate(leave.endDate)}\nReason: "${leave.reason}"`;
                leaveContent = `
                    <div class="leave-cell-block ${leaveTypeClass}" 
                         title="${titleText}" 
                         onclick="openModal(${leave.id})">
                        ${leave.type.substring(0, 3)}
                    </div>
                `;
            }

            html += `
                <td class="timeline-td-day ${isWeekend ? 'is-weekend' : ''} ${isToday ? 'is-today' : ''}">
                    ${leaveContent}
                </td>
            `;
        }

        html += `</tr>`;
    });

    html += `</tbody></table>`;
    timelineWrapper.innerHTML = html;
}

function renderMonthGrid(totalDays, today, monthLeaves, dayAvailability) {
    if (!monthGridWrapper) return;

    const weekdayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Determine day of week for the 1st day of month (0 = Sun, 1 = Mon ... 6 = Sat)
    const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
    // Convert to Monday = 0, Sunday = 6
    const startPadding = (firstDayIndex === 0) ? 6 : firstDayIndex - 1;

    let html = `
        <div class="month-days-header">
            ${weekdayHeaders.map(w => `<div>${w}</div>`).join('')}
        </div>
        <div class="month-grid-cells">
    `;

    // Padding empty cells for previous month
    for (let p = 0; p < startPadding; p++) {
        html += `<div class="month-day-cell other-month"></div>`;
    }

    // Days of the month
    for (let day = 1; day <= totalDays; day++) {
        const info = dayAvailability[day];
        const isToday = (info.dateStr === today);
        const hasAbsences = (info.dayLeaves.length > 0);
        const covClass = (info.availableStaff === info.totalStaff) ? 'cov-ok' : 'cov-warn';

        let leavePillsHtml = '';
        info.dayLeaves.forEach(leave => {
            if (leave.status === 'rejected') return;
            const emp = employees[leave.employeeId] || { name: 'Colleague' };
            const typeClass = getLeaveTypeClass(leave.type, leave.status);
            leavePillsHtml += `
                <div class="month-leave-pill ${typeClass}" 
                     title="${emp.name}: ${leave.type} (${leave.status})\n${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}"
                     onclick="openModal(${leave.id})">
                    <span>${emp.name.split(' ')[0]}:</span>
                    <span>${leave.type}</span>
                </div>
            `;
        });

        html += `
            <div class="month-day-cell ${isToday ? 'is-today' : ''}">
                <div class="cell-top-bar">
                    <span class="cell-day-num">${day}</span>
                    <span class="cell-coverage-pill ${covClass}">
                        ${info.availableStaff}/${info.totalStaff} avl
                    </span>
                </div>
                <div class="month-leaves-container">
                    ${leavePillsHtml}
                </div>
            </div>
        `;
    }

    html += `</div>`;
    monthGridWrapper.innerHTML = html;
}

function getLeaveTypeClass(type, status) {
    if (status === 'pending') return 'leave-pending';
    if (type === 'Vacation') return 'leave-vacation';
    if (type === 'Sick Leave') return 'leave-sick';
    if (type === 'Personal Leave') return 'leave-personal';
    return 'leave-vacation';
}

// 3. Render Upcoming Team Absences Widget
function renderUpcomingAbsences() {
    if (!upcomingListEl) return;
    upcomingListEl.innerHTML = '';
    
    const upcoming = window.DB.getUpcomingAbsences();
    const today = new Date().toISOString().split('T')[0];

    if (upcoming.length === 0) {
        upcomingListEl.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">🌴</div>
                <p>No upcoming team absences scheduled. All team members are currently active.</p>
            </div>
        `;
        return;
    }

    upcoming.forEach(req => {
        const emp = employees[req.employeeId] || { name: 'Unknown', role: 'Team Member', avatar: 'https://i.pravatar.cc/150' };
        
        const isActiveNow = (today >= req.startDate && today <= req.endDate);
        const tagText = isActiveNow ? 'Active Now' : getRelativeDaysText(req.startDate, today);
        const tagClass = isActiveNow ? 'tag-active' : 'tag-upcoming';
        const cardClass = isActiveNow ? 'upcoming-card-item active-now' : 'upcoming-card-item';

        const card = document.createElement('div');
        card.className = cardClass;
        card.innerHTML = `
            <div class="upcoming-top">
                <div class="upcoming-emp">
                    <img src="${emp.avatar}" alt="${emp.name}" class="avatar">
                    <div>
                        <div class="upcoming-name">${emp.name}</div>
                        <div class="upcoming-role">${emp.role} &bull; ${emp.department || 'Engineering'}</div>
                    </div>
                </div>
                <span class="tag-timeline ${tagClass}">${tagText}</span>
            </div>
            <div class="upcoming-body">
                <div>
                    <span class="upcoming-type-tag">${req.type}</span>
                    <span style="font-size: 0.8rem; color: var(--text-muted);"> (${req.daysRequested} days)</span>
                </div>
                <div class="upcoming-dates">${formatDate(req.startDate)} &ndash; ${formatDate(req.endDate)}</div>
            </div>
        `;
        upcomingListEl.appendChild(card);
    });
}

function getRelativeDaysText(startDate, today) {
    const s = new Date(startDate + 'T00:00:00');
    const t = new Date(today + 'T00:00:00');
    const diffDays = Math.ceil((s - t) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Starts Tomorrow';
    if (diffDays > 1) return `Starts in ${diffDays} days`;
    return 'Starts Today';
}

// 4. Render Team Profiles & Available Leave Entitlements
function renderTeamEntitlements() {
    if (!teamListEl) return;
    teamListEl.innerHTML = '';

    const empList = Object.values(employees);

    empList.forEach(emp => {
        const card = document.createElement('div');
        card.className = 'team-card';
        card.innerHTML = `
            <div class="team-emp-header">
                <img src="${emp.avatar}" alt="${emp.name}" class="avatar-lg">
                <div class="team-emp-info">
                    <h4>${emp.name}</h4>
                    <p>${emp.role} &bull; ${emp.department || 'Team'}</p>
                </div>
            </div>
            <div class="entitlement-bars">
                <div class="entitlement-pill">
                    <span class="entitlement-label">Vacation</span>
                    <span class="entitlement-value">${emp.balances['Vacation'] || 0}d</span>
                </div>
                <div class="entitlement-pill">
                    <span class="entitlement-label">Sick Leave</span>
                    <span class="entitlement-value">${emp.balances['Sick Leave'] || 0}d</span>
                </div>
                <div class="entitlement-pill">
                    <span class="entitlement-label">Personal</span>
                    <span class="entitlement-value">${emp.balances['Personal Leave'] || 0}d</span>
                </div>
            </div>
            <div style="display: flex; justify-content: flex-end; margin-top: 0.25rem;">
                <button class="btn btn-secondary btn-sm" onclick="openProfileModal(${emp.id})">
                    View Profile & History &rarr;
                </button>
            </div>
        `;
        teamListEl.appendChild(card);
    });
}

// 5. Render Requests List
function renderRequests() {
    requestListEl.innerHTML = '';
    
    const sortedReqs = [...requests].sort((a,b) => b.id - a.id);
    
    const filtered = sortedReqs.filter(req => {
        if (currentFilter === 'all') return true;
        return req.status === currentFilter;
    });

    if (filtered.length === 0) {
        requestListEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📂</div>
                <p>No leave requests found matching "${currentFilter}".</p>
            </div>
        `;
        return;
    }

    filtered.forEach((req) => {
        const emp = employees[req.employeeId] || { name: 'Unknown', role: 'Employee', avatar: 'https://i.pravatar.cc/150' };
        const item = document.createElement('div');
        item.className = 'request-item';
        
        let commentNotice = '';
        if (req.comment) {
            commentNotice = `<div style="font-size: 0.8rem; color: #a5b4fc; margin-top: 0.25rem;"><strong>Manager Comment:</strong> "${req.comment}"</div>`;
        }

        item.innerHTML = `
            <div class="req-info">
                <img src="${emp.avatar}" alt="${emp.name}" class="avatar">
                <div>
                    <div class="req-name">${emp.name} &bull; <span style="font-size: 0.85rem; font-weight: normal; color: var(--text-muted);">${emp.role}</span></div>
                    <div class="req-meta">
                        <strong>${req.type}</strong> &bull; ${formatDate(req.startDate)} to ${formatDate(req.endDate)} (${req.daysRequested} days)
                    </div>
                    <div class="req-reason-snippet">"${req.reason}"</div>
                    ${commentNotice}
                </div>
            </div>
            <div class="req-actions">
                <span class="req-status status-${req.status}">${req.status}</span>
                <button class="btn btn-primary btn-sm" onclick="openModal(${req.id})">
                    ${req.status === 'pending' ? 'Review Request' : 'View Details'}
                </button>
            </div>
        `;
        requestListEl.appendChild(item);
    });
}

// 6. Open Review Modal
window.openModal = function(id) {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    
    selectedRequestId = id;
    const emp = employees[req.employeeId] || { name: 'Unknown', role: 'Employee', balances: {} };
    
    document.getElementById('modal-avatar').src = emp.avatar;
    document.getElementById('modal-name').innerText = emp.name;
    document.getElementById('modal-role').innerText = `${emp.role} • ${emp.department || 'Engineering'}`;
    document.getElementById('modal-type').innerText = req.type;
    document.getElementById('modal-dates').innerText = `${formatDate(req.startDate)} - ${formatDate(req.endDate)} (${req.daysRequested} days)`;
    document.getElementById('modal-reason').innerText = req.reason;
    document.getElementById('modal-heading').innerText = req.status === 'pending' ? 'Review Leave Request' : 'Leave Request Details';
    commentsInput.value = req.comment || '';
    
    // Render current balances pills
    modalBalancesPills.innerHTML = `
        <div class="mini-pill">
            <span>Vacation</span>
            <strong>${emp.balances['Vacation'] || 0}d left</strong>
        </div>
        <div class="mini-pill">
            <span>Sick</span>
            <strong>${emp.balances['Sick Leave'] || 0}d left</strong>
        </div>
        <div class="mini-pill">
            <span>Personal</span>
            <strong>${emp.balances['Personal Leave'] || 0}d left</strong>
        </div>
    `;

    // Check for scheduling conflicts / overlaps
    const overlaps = window.DB.getOverlappingAbsences(req.startDate, req.endDate, req.employeeId);
    if (overlaps.length > 0) {
        const overlapEmps = overlaps.map(o => {
            const oEmp = employees[o.employeeId];
            return `${oEmp ? oEmp.name : 'Teammate'} (${o.type}, ${formatDate(o.startDate)} - ${formatDate(o.endDate)})`;
        }).join(', ');
        modalOverlapDesc.innerText = `Concurrent absence alert: ${overlapEmps} will be away during this period.`;
        modalOverlapAlert.style.display = 'flex';
    } else {
        modalOverlapAlert.style.display = 'none';
    }

    // Render employee past leave history preview
    const empHistory = window.DB.getEmployeeHistory(req.employeeId).filter(h => h.id !== req.id);
    modalHistoryList.innerHTML = '';
    if (empHistory.length === 0) {
        modalHistoryList.innerHTML = '<p class="text-muted" style="font-size: 0.82rem;">No previous leave requests on record.</p>';
    } else {
        empHistory.slice(0, 4).forEach(h => {
            const row = document.createElement('div');
            row.className = 'mini-hist-row';
            row.innerHTML = `
                <div>
                    <div><strong>${h.type}</strong> &bull; ${formatDate(h.startDate)} - ${formatDate(h.endDate)} (${h.daysRequested}d)</div>
                    ${h.comment ? `<div class="mini-note">Note: ${h.comment}</div>` : ''}
                </div>
                <span class="req-status status-${h.status}">${h.status}</span>
            `;
            modalHistoryList.appendChild(row);
        });
    }
    
    // Action buttons display
    if (req.status !== 'pending') {
        approveBtn.style.display = 'none';
        rejectBtn.style.display = 'none';
        commentsInput.readOnly = true;
    } else {
        approveBtn.style.display = 'block';
        rejectBtn.style.display = 'block';
        commentsInput.readOnly = false;
    }

    reviewModal.classList.add('active');
    
    if (req.status === 'pending') {
        setTimeout(() => commentsInput.focus(), 300);
    }
};

function closeModal() {
    reviewModal.classList.remove('active');
    selectedRequestId = null;
    setTimeout(() => {
        commentsInput.value = '';
    }, 250);
}

// 7. Handle Manager Approve / Reject Decision
function handleDecision(status) {
    if (!selectedRequestId) return;
    
    const reqIndex = requests.findIndex(r => r.id === selectedRequestId);
    if (reqIndex !== -1) {
        const req = requests[reqIndex];
        req.status = status;
        req.comment = commentsInput.value.trim();
        
        // If approved, deduct available balance from employee
        if (status === 'approved') {
            const emp = employees[req.employeeId];
            if (emp && emp.balances[req.type] !== undefined) {
                emp.balances[req.type] = Math.max(0, emp.balances[req.type] - req.daysRequested);
                window.DB.updateEmployee(emp.id, emp);
            }
        }
        
        window.DB.updateRequest(req.id, req);
        
        // Notify employee
        window.DB.addNotification({
            userId: req.employeeId,
            role: 'employee',
            message: `Your ${req.type} request was ${status}.`,
            type: status
        });

        loadData();
        closeModal();
        updateStats();
        renderUpcomingAbsences();
        renderTeamEntitlements();
        renderRequests();
        renderCalendar();
    }
}

// 8. Open Full Employee Profile Modal
window.openProfileModal = function(employeeId) {
    const emp = employees[employeeId];
    if (!emp) return;

    document.getElementById('prof-modal-avatar').src = emp.avatar;
    document.getElementById('prof-modal-fullname').innerText = emp.name;
    document.getElementById('prof-modal-name').innerText = `${emp.name}'s Profile`;
    document.getElementById('prof-modal-dept').innerText = `${emp.role} • ${emp.department || 'Engineering'}`;

    // Entitlements
    const entContainer = document.getElementById('prof-modal-entitlements');
    entContainer.innerHTML = `
        <div class="entitlement-pill">
            <span class="entitlement-label">Vacation Left</span>
            <span class="entitlement-value">${emp.balances['Vacation'] || 0} days</span>
        </div>
        <div class="entitlement-pill">
            <span class="entitlement-label">Sick Leave Left</span>
            <span class="entitlement-value">${emp.balances['Sick Leave'] || 0} days</span>
        </div>
        <div class="entitlement-pill">
            <span class="entitlement-label">Personal Left</span>
            <span class="entitlement-value">${emp.balances['Personal Leave'] || 0} days</span>
        </div>
    `;

    // History Records
    const histContainer = document.getElementById('prof-modal-history');
    histContainer.innerHTML = '';
    const empHistory = window.DB.getEmployeeHistory(employeeId);

    if (empHistory.length === 0) {
        histContainer.innerHTML = '<p class="text-muted" style="padding: 1rem 0;">No leave history available for this employee.</p>';
    } else {
        empHistory.forEach(h => {
            const item = document.createElement('div');
            item.className = 'prof-hist-item';
            item.innerHTML = `
                <div>
                    <div style="font-weight: 600;">${h.type} &bull; ${h.daysRequested} Days</div>
                    <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.15rem;">
                        ${formatDate(h.startDate)} to ${formatDate(h.endDate)}
                    </div>
                    <div style="font-size: 0.82rem; margin-top: 0.35rem; color: #cbd5e1;">"${h.reason}"</div>
                    ${h.comment ? `<div style="font-size: 0.78rem; color: #818cf8; margin-top: 0.25rem;"><strong>Manager:</strong> ${h.comment}</div>` : ''}
                </div>
                <div>
                    <span class="req-status status-${h.status}">${h.status}</span>
                </div>
            `;
            histContainer.appendChild(item);
        });
    }

    profileModal.classList.add('active');
};

function closeProfileModal() {
    profileModal.classList.remove('active');
}

// 10. Render Tasks
function renderTasks() {
    if (!taskListEl) return;
    taskListEl.innerHTML = '';
    
    if (tasks.length === 0) {
        taskListEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <p>No tasks assigned. Create a new task to get started.</p>
            </div>
        `;
        return;
    }

    tasks.forEach(task => {
        const emp = employees[task.assigneeId];
        const item = document.createElement('div');
        item.className = 'task-card';
        item.style.border = '1px solid var(--border-color)';
        item.style.padding = '1rem';
        item.style.borderRadius = '8px';
        item.style.marginBottom = '1rem';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';

        item.innerHTML = `
            <div>
                <h4 style="margin-bottom: 0.25rem;">${task.title}</h4>
                <div style="font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem;">
                    <img src="${emp?.avatar || ''}" class="avatar" style="width: 24px; height: 24px;" alt="">
                    <span>Assigned to: <strong>${emp?.name || 'Unknown'}</strong></span>
                </div>
                <div style="font-size: 0.85rem; margin-top: 0.5rem;">
                    📅 ${formatDate(task.startDate)} - ${formatDate(task.endDate)}
                </div>
            </div>
            <div>
                <span class="req-status status-approved">${task.status}</span>
            </div>
        `;
        taskListEl.appendChild(item);
    });
}

function checkTaskConflict() {
    const assigneeId = taskAssigneeSelect.value;
    const start = taskStartInput.value;
    const end = taskEndInput.value;
    
    // Clear alerts
    taskConflictAlert.style.display = 'none';
    assigneeStatusIndicator.style.display = 'none';

    if (!assigneeId) return;

    // Show upcoming leave status for the selected user
    const empUpcoming = window.DB.getUpcomingAbsences().filter(r => r.employeeId == assigneeId);
    if (empUpcoming.length > 0) {
        assigneeStatusText.innerHTML = \`<strong>Upcoming Absences:</strong> \` + empUpcoming.map(u => \`\${u.type} (\${formatDate(u.startDate)} to \${formatDate(u.endDate)})\`).join(', ');
        assigneeStatusIndicator.style.display = 'flex';
    } else {
        assigneeStatusText.innerHTML = "No upcoming absences scheduled.";
        assigneeStatusIndicator.style.display = 'flex';
    }

    if (start && end) {
        const overlaps = window.DB.getOverlappingAbsences(start, end).filter(r => r.employeeId == assigneeId);
        if (overlaps.length > 0) {
            const leave = overlaps[0];
            taskConflictDesc.innerText = \`The selected assignee is on \${leave.type} from \${formatDate(leave.startDate)} to \${formatDate(leave.endDate)}.\`;
            taskConflictAlert.style.display = 'flex';
        }
    }
}

function openTaskModal() {
    taskForm.reset();
    taskConflictAlert.style.display = 'none';
    assigneeStatusIndicator.style.display = 'none';
    
    // Populate select
    taskAssigneeSelect.innerHTML = '<option value="" disabled selected>Select a team member</option>';
    Object.values(employees).forEach(emp => {
        taskAssigneeSelect.innerHTML += \`<option value="\${emp.id}">\${emp.name}</option>\`;
    });

    taskModal.classList.add('active');
}

function closeTaskModal() {
    taskModal.classList.remove('active');
}

// 9. Event Listeners Setup
function setupEventListeners() {
    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderRequests();
        });
    });

    // Notifications Dropdown
    const notifBtn = document.getElementById('notif-btn');
    const notifDropdown = document.getElementById('notif-dropdown');
    if (notifBtn && notifDropdown) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifDropdown.style.display = notifDropdown.style.display === 'none' ? 'block' : 'none';
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.notifications-wrapper')) {
                notifDropdown.style.display = 'none';
            }
        });
    }

    const markAllBtn = document.getElementById('mark-all-read-btn');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const notifs = window.DB.getNotifications(null, 'manager');
            notifs.forEach(n => {
                if (!n.read) window.DB.markNotificationAsRead(n.id);
            });
            renderNotifications();
        });
    }

    // Settings Event Listeners
    if (generalSettingsForm) {
        generalSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const settings = window.DB.getSettings();
            settings.accrualPolicy = accrualPolicySelect.value;
            settings.autoApproveThreshold = parseInt(autoApproveInput.value, 10) || 0;
            window.DB.updateSettings(settings);
            showToast('General policies updated successfully.');
        });
    }

    if (addLeaveTypeBtn) {
        addLeaveTypeBtn.addEventListener('click', () => {
            const name = prompt("Enter the name of the new leave type (e.g., Maternity Leave):");
            if (!name) return;
            const days = parseInt(prompt("Enter default allowance (days):"), 10) || 0;
            const reqApp = confirm("Does this leave type require manager approval? (OK for Yes, Cancel for No)");
            
            const newLt = {
                id: name.toLowerCase().replace(/\\s+/g, '-'),
                name: name,
                defaultAllowance: days,
                requiresApproval: reqApp,
                colorClass: 'leave-pending'
            };

            const settings = window.DB.getSettings();
            settings.leaveTypes.push(newLt);
            window.DB.updateSettings(settings);
            renderSettings();
            showToast(`${name} added to leave types.`);
        });
    }

    // Calendar Navigation
    if (calPrevMonthBtn) {
        calPrevMonthBtn.addEventListener('click', () => {
            calMonth--;
            if (calMonth < 0) {
                calMonth = 11;
                calYear--;
            }
            renderCalendar();
        });
    }

    if (calNextMonthBtn) {
        calNextMonthBtn.addEventListener('click', () => {
            calMonth++;
            if (calMonth > 11) {
                calMonth = 0;
                calYear++;
            }
            renderCalendar();
        });
    }

    if (calTodayBtn) {
        calTodayBtn.addEventListener('click', () => {
            calYear = 2026;
            calMonth = 9; // October 2026
            renderCalendar();
        });
    }

    // View Toggles
    if (viewTimelineBtn && viewMonthBtn) {
        viewTimelineBtn.addEventListener('click', () => {
            viewTimelineBtn.classList.add('active');
            viewMonthBtn.classList.remove('active');
            calView = 'timeline';
            calendarTimelineView.style.display = 'block';
            calendarMonthView.style.display = 'none';
            renderCalendar();
        });

        viewMonthBtn.addEventListener('click', () => {
            viewMonthBtn.classList.add('active');
            viewTimelineBtn.classList.remove('active');
            calView = 'month';
            calendarTimelineView.style.display = 'none';
            calendarMonthView.style.display = 'block';
            renderCalendar();
        });
    }

    // Modals
    closeModalBtn.addEventListener('click', closeModal);
    cancelReviewBtn.addEventListener('click', closeModal);
    reviewModal.addEventListener('click', (e) => {
        if (e.target === reviewModal) closeModal();
    });

    closeProfileModalBtn.addEventListener('click', closeProfileModal);
    closeProfileBtn.addEventListener('click', closeProfileModal);
    profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) closeProfileModal();
    });

    approveBtn.addEventListener('click', () => handleDecision('approved'));
    rejectBtn.addEventListener('click', () => handleDecision('rejected'));
    
    // Task Modal Events
    if (newTaskBtn) newTaskBtn.addEventListener('click', openTaskModal);
    if (closeTaskModalBtn) closeTaskModalBtn.addEventListener('click', closeTaskModal);
    if (cancelTaskBtn) cancelTaskBtn.addEventListener('click', closeTaskModal);
    if (taskModal) {
        taskModal.addEventListener('click', (e) => {
            if (e.target === taskModal) closeTaskModal();
        });
    }

    if (taskAssigneeSelect) taskAssigneeSelect.addEventListener('change', checkTaskConflict);
    if (taskStartInput) taskStartInput.addEventListener('change', checkTaskConflict);
    if (taskEndInput) taskEndInput.addEventListener('change', checkTaskConflict);

    if (taskForm) {
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const assigneeId = taskAssigneeSelect.value;
            const start = taskStartInput.value;
            const end = taskEndInput.value;
            
            // Check for conflict again
            const overlaps = window.DB.getOverlappingAbsences(start, end).filter(r => r.employeeId == assigneeId);
            if (overlaps.length > 0) {
                if (!confirm("This task overlaps with an approved leave. Assign anyway?")) {
                    return;
                }
            }

            const newTask = {
                id: Date.now(),
                title: document.getElementById('task-title').value,
                assigneeId: assigneeId,
                startDate: start,
                endDate: end,
                description: document.getElementById('task-desc').value,
                status: 'pending'
            };

            window.DB.addTask(newTask);
            
            // Notify Employee
            window.DB.addNotification({
                userId: assigneeId,
                role: 'employee',
                message: `You've been assigned a new task: ${newTask.title}`,
                type: 'info'
            });

            loadData();
            renderTasks();
            closeTaskModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (reviewModal.classList.contains('active')) closeModal();
            if (profileModal.classList.contains('active')) closeProfileModal();
            if (taskModal && taskModal.classList.contains('active')) closeTaskModal();
        }
    });
}

// 11. Helper to format Date
function formatDate(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// 12. Notifications System
function renderNotifications() {
    const notifs = window.DB.getNotifications(null, 'manager');
    const unreadCount = notifs.filter(n => !n.read).length;
    
    const badge = document.getElementById('notif-badge');
    if (badge) {
        badge.innerText = unreadCount;
        badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
    
    const list = document.getElementById('notif-list');
    if (list) {
        list.innerHTML = '';
        if (notifs.length === 0) {
            list.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No notifications.</div>';
            return;
        }
        
        notifs.forEach(n => {
            const item = document.createElement('div');
            item.style.padding = '0.75rem 1rem';
            item.style.borderBottom = '1px solid var(--border-color)';
            item.style.fontSize = '0.85rem';
            item.style.background = n.read ? 'transparent' : 'rgba(99, 102, 241, 0.1)';
            item.style.cursor = 'pointer';
            
            let icon = '📩';
            if (n.type === 'approved') icon = '✅';
            if (n.type === 'rejected') icon = '❌';

            item.innerHTML = `
                <div style="display: flex; gap: 0.5rem; align-items: flex-start;">
                    <span>${icon}</span>
                    <div style="flex: 1;">
                        <div style="color: var(--text-main); font-weight: ${n.read ? '400' : '600'};">${n.message}</div>
                        <div style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.25rem;">${new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                </div>
            `;
            item.addEventListener('click', () => {
                if (!n.read) {
                    window.DB.markNotificationAsRead(n.id);
                    renderNotifications();
                }
            });
            list.appendChild(item);
        });
    }
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.style.background = 'var(--card-bg)';
    toast.style.border = '1px solid var(--border-color)';
    toast.style.padding = '1rem 1.25rem';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    toast.style.color = 'var(--text-main)';
    toast.style.fontSize = '0.9rem';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '0.5rem';
    toast.style.animation = 'slideIn 0.3s ease-out forwards';
    
    toast.innerHTML = `<span>🔔</span> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// 13. Settings System
function renderSettings() {
    if (!accrualPolicySelect) return;
    
    const settings = window.DB.getSettings();
    
    // General Settings
    accrualPolicySelect.value = settings.accrualPolicy;
    autoApproveInput.value = settings.autoApproveThreshold;

    // Leave Types List
    if (leaveTypesListEl) {
        leaveTypesListEl.innerHTML = '';
        settings.leaveTypes.forEach(lt => {
            const item = document.createElement('div');
            item.className = 'leave-type-item';
            item.innerHTML = `
                <div class="leave-type-info">
                    <span class="leave-type-name">${lt.name}</span>
                    <span class="leave-type-meta">Allowance: ${lt.defaultAllowance} days &bull; ${lt.requiresApproval ? 'Requires Approval' : 'Auto-Approve'}</span>
                </div>
                <button class="btn btn-sm btn-danger remove-lt-btn" data-id="${lt.id}">Remove</button>
            `;
            leaveTypesListEl.appendChild(item);
        });

        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-lt-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idToRemove = e.target.getAttribute('data-id');
                const newSettings = window.DB.getSettings();
                newSettings.leaveTypes = newSettings.leaveTypes.filter(lt => lt.id !== idToRemove);
                window.DB.updateSettings(newSettings);
                renderSettings();
                showToast(`Leave type removed.`);
            });
        });
    }
}

// Global initialization
document.addEventListener('DOMContentLoaded', init);

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
