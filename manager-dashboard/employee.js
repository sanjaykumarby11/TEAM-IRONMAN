let currentEmployeeId = 1;
let myRequests = [];
let me = null;
let currentFilter = 'all';

// Calendar State for Employee Portal
let empCalYear = 2026;
let empCalMonth = 9; // October (0-indexed)
let empCalView = 'timeline'; // 'timeline' | 'month'

// DOM Elements
const form = document.getElementById('leave-form');
const typeInput = document.getElementById('leave-type');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const reasonInput = document.getElementById('leave-reason');

const errDate = document.getElementById('err-date');
const errType = document.getElementById('err-type');
const errReason = document.getElementById('err-reason');

const previewBox = document.getElementById('request-preview-box');
const previewDurationText = document.getElementById('preview-duration-text');
const previewOverlapText = document.getElementById('preview-overlap-text');

const requestListEl = document.getElementById('my-requests-list');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

const employeeSwitcher = document.getElementById('employee-switcher');
const userAvatar = document.getElementById('user-avatar');
const heroAvatar = document.getElementById('hero-avatar');
const heroName = document.getElementById('hero-name');
const heroRole = document.getElementById('hero-role');
const heroStatusSummary = document.getElementById('hero-status-summary');
const balancesContainer = document.getElementById('balances-container');
const teamAbsencesList = document.getElementById('team-absences-list');
const teamAbsenceCount = document.getElementById('team-absence-count');
const histFilterBtns = document.querySelectorAll('.hist-filter-btn');

// Calendar DOM Elements
const empCalPrev = document.getElementById('emp-cal-prev');
const empCalNext = document.getElementById('emp-cal-next');
const empCalToday = document.getElementById('emp-cal-today');
const empCalMonthDisplay = document.getElementById('emp-cal-month-display');
const empViewTimelineBtn = document.getElementById('emp-view-timeline-btn');
const empViewMonthBtn = document.getElementById('emp-view-month-btn');
const empTimelineView = document.getElementById('emp-timeline-view');
const empMonthView = document.getElementById('emp-month-view');
const empTimelineWrapper = document.getElementById('emp-timeline-wrapper');
const empMonthGridWrapper = document.getElementById('emp-month-grid-wrapper');
const empCoverageSummary = document.getElementById('emp-coverage-summary');

function init() {
    loadData();
    renderHeroAndBalances();
    renderTeamAbsences();
    renderRequests();
    renderEmployeeCalendar();
    renderNotifications();
    setupDatePickers();
    populateLeaveTypes();
    setupEventListeners();

    // Listen for storage changes from manager tab
    window.addEventListener('storage', () => {
        loadData();
        renderHeroAndBalances();
        renderTeamAbsences();
        renderRequests();
        renderEmployeeCalendar();
        
        // Check for new unread notifications for THIS employee
        const newNotifs = window.DB.getNotifications(currentEmployeeId, 'employee').filter(n => !n.read && !n._toastShown);
        newNotifs.forEach(n => {
            showToast(n.message);
            n._toastShown = true;
        });
        renderNotifications();
    });
}

function loadData() {
    me = window.DB.getEmployee(currentEmployeeId) || {
        id: currentEmployeeId,
        name: 'Employee',
        role: 'Team Member',
        avatar: 'https://i.pravatar.cc/150',
        balances: { 'Vacation': 0, 'Sick Leave': 0, 'Personal Leave': 0 }
    };
    const allReqs = window.DB.getRequests();
    myRequests = allReqs.filter(r => r.employeeId == currentEmployeeId);
}

// 1. Render Hero Profile & Leave Balances
function renderHeroAndBalances() {
    if (!me) return;

    userAvatar.src = me.avatar;
    heroAvatar.src = me.avatar;
    heroName.innerText = me.name;
    heroRole.innerText = `${me.role} • ${me.department || 'Engineering'}`;

    const pendingCount = myRequests.filter(r => r.status === 'pending').length;
    heroStatusSummary.innerText = pendingCount === 1 ? '1 Pending Request' : `${pendingCount} Pending Requests`;

    // Render Balances (Dynamically from settings if available in employee balances)
    const settings = window.DB.getSettings();
    balancesContainer.innerHTML = '';
    
    settings.leaveTypes.forEach(lt => {
        const balance = me.balances[lt.name] !== undefined ? me.balances[lt.name] : lt.defaultAllowance;
        balancesContainer.innerHTML += `
            <div class="balance-card">
                <h3>${lt.name}</h3>
                <p>${balance} <span>days</span></p>
            </div>
        `;
    });
}

// 2. Render Upcoming Team Absences Widget
function renderTeamAbsences() {
    if (!teamAbsencesList) return;
    teamAbsencesList.innerHTML = '';

    const allUpcoming = window.DB.getUpcomingAbsences();
    const employees = window.DB.getEmployees();
    const today = new Date().toISOString().split('T')[0];

    if (allUpcoming.length === 0) {
        teamAbsencesList.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; padding: 1.5rem;">
                <p>No teammates are currently scheduled away. Perfect time to coordinate coverage!</p>
            </div>
        `;
        teamAbsenceCount.innerText = '0 Teammates Away';
        return;
    }

    teamAbsenceCount.innerText = `${allUpcoming.length} Teammates Away`;

    allUpcoming.forEach(item => {
        const emp = employees[item.employeeId] || { name: 'Teammate', avatar: 'https://i.pravatar.cc/150', role: 'Colleague' };
        const isSelf = (item.employeeId == currentEmployeeId);
        const isActiveNow = (today >= item.startDate && today <= item.endDate);

        const chip = document.createElement('div');
        chip.className = 'team-absence-chip';
        chip.innerHTML = `
            <img src="${emp.avatar}" alt="${emp.name}" class="chip-avatar">
            <div style="flex: 1;">
                <div class="chip-name">${emp.name} ${isSelf ? '<span style="font-size: 0.72rem; color: #a5b4fc;">(You)</span>' : ''}</div>
                <div class="chip-type">${item.type} &bull; ${item.daysRequested}d</div>
                <div class="chip-dates">${formatDate(item.startDate)} - ${formatDate(item.endDate)}</div>
            </div>
            ${isActiveNow ? '<span class="badge-subtle" style="background: rgba(16, 185, 129, 0.2); color: #6ee7b7; font-size: 0.7rem; font-weight: 700;">AWAY NOW</span>' : ''}
        `;
        teamAbsencesList.appendChild(chip);
    });
}

// 3. Render Team Availability & Coverage Calendar (Employee View)
function renderEmployeeCalendar() {
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    if (empCalMonthDisplay) {
        empCalMonthDisplay.innerText = `${monthNames[empCalMonth]} ${empCalYear}`;
    }

    const totalDays = new Date(empCalYear, empCalMonth + 1, 0).getDate();
    const today = new Date().toISOString().split('T')[0];
    const employees = window.DB.getEmployees();
    const empList = Object.values(employees);
    const totalStaff = empList.length;

    const monthLeaves = window.DB.getLeavesForMonth(empCalYear, empCalMonth);

    let fullCoverageDays = 0;
    let reducedCoverageDays = 0;
    let totalAvailableRatioSum = 0;

    const dayAvailability = [];

    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${empCalYear}-${String(empCalMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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

    if (empCoverageSummary) {
        empCoverageSummary.innerHTML = `
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
                    <h4>Full Team Coverage</h4>
                    <p class="metric-green">${fullCoverageDays} Days</p>
                </div>
            </div>
            <div class="coverage-metric-card">
                <div class="coverage-metric-icon">⚠️</div>
                <div class="coverage-metric-info">
                    <h4>Teammates Off Days</h4>
                    <p class="${reducedCoverageDays > 0 ? 'metric-amber' : 'metric-green'}">${reducedCoverageDays} Days</p>
                </div>
            </div>
            <div class="coverage-metric-card">
                <div class="coverage-metric-icon">👥</div>
                <div class="coverage-metric-info">
                    <h4>Avg Team Capacity</h4>
                    <p class="metric-cyan">${avgCoveragePct}%</p>
                </div>
            </div>
        `;
    }

    if (empCalView === 'timeline') {
        renderEmployeeTimelineMatrix(totalDays, today, empList, monthLeaves, dayAvailability);
    } else {
        renderEmployeeMonthGrid(totalDays, today, monthLeaves, dayAvailability);
    }
}

function renderEmployeeTimelineMatrix(totalDays, today, empList, monthLeaves, dayAvailability) {
    if (!empTimelineWrapper) return;
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    let html = `
        <table class="timeline-table">
            <thead>
                <tr>
                    <th class="timeline-th-emp">Team Member</th>
    `;

    for (let day = 1; day <= totalDays; day++) {
        const d = new Date(empCalYear, empCalMonth, day);
        const dayOfWeek = d.getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        const dateStr = `${empCalYear}-${String(empCalMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = (dateStr === today);

        html += `
            <th class="timeline-th-day ${isWeekend ? 'is-weekend' : ''} ${isToday ? 'is-today' : ''}" title="${dateStr}">
                <span class="day-num">${day}</span>
                <span class="day-name">${dayNames[dayOfWeek]}</span>
            </th>
        `;
    }
    html += `</tr></thead><tbody>`;

    // Capacity row
    html += `
        <tr class="timeline-row-capacity">
            <td class="timeline-capacity-label">Team Availability</td>
    `;
    for (let day = 1; day <= totalDays; day++) {
        const info = dayAvailability[day];
        let badgeClass = 'cap-full';
        if (info.availableStaff < info.totalStaff) {
            badgeClass = info.availableStaff <= 1 ? 'cap-critical' : 'cap-reduced';
        }
        html += `
            <td class="timeline-capacity-cell" title="${info.dateStr}: ${info.availableStaff}/${info.totalStaff} staff available">
                <span class="cap-badge ${badgeClass}">${info.availableStaff}/${info.totalStaff}</span>
            </td>
        `;
    }
    html += `</tr>`;

    // Employee rows
    empList.forEach(emp => {
        const isMe = (emp.id == currentEmployeeId);
        html += `
            <tr class="timeline-row-emp">
                <td class="timeline-td-emp">
                    <div class="emp-matrix-card">
                        <img src="${emp.avatar}" alt="${emp.name}" class="avatar">
                        <div class="emp-matrix-info">
                            <div class="emp-m-name">${emp.name} ${isMe ? '<span style="color:#a5b4fc; font-size: 0.72rem;">(You)</span>' : ''}</div>
                            <div class="emp-m-role">${emp.role}</div>
                        </div>
                    </div>
                </td>
        `;

        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${empCalYear}-${String(empCalMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const d = new Date(empCalYear, empCalMonth, day);
            const isWeekend = (d.getDay() === 0 || d.getDay() === 6);
            const isToday = (dateStr === today);

            const leave = monthLeaves.find(r => r.employeeId == emp.id && r.startDate <= dateStr && r.endDate >= dateStr && r.status !== 'rejected');

            let leaveContent = '';
            if (leave) {
                const leaveTypeClass = getLeaveTypeClass(leave.type, leave.status);
                const titleText = `${emp.name}: ${leave.type} (${leave.status})\n${formatDate(leave.startDate)} to ${formatDate(leave.endDate)}`;
                leaveContent = `
                    <div class="leave-cell-block ${leaveTypeClass}" title="${titleText}">
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
    empTimelineWrapper.innerHTML = html;
}

function renderEmployeeMonthGrid(totalDays, today, monthLeaves, dayAvailability) {
    if (!empMonthGridWrapper) return;
    const weekdayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const firstDayIndex = new Date(empCalYear, empCalMonth, 1).getDay();
    const startPadding = (firstDayIndex === 0) ? 6 : firstDayIndex - 1;
    const employees = window.DB.getEmployees();

    let html = `
        <div class="month-days-header">
            ${weekdayHeaders.map(w => `<div>${w}</div>`).join('')}
        </div>
        <div class="month-grid-cells">
    `;

    for (let p = 0; p < startPadding; p++) {
        html += `<div class="month-day-cell other-month"></div>`;
    }

    for (let day = 1; day <= totalDays; day++) {
        const info = dayAvailability[day];
        const isToday = (info.dateStr === today);
        const covClass = (info.availableStaff === info.totalStaff) ? 'cov-ok' : 'cov-warn';

        let leavePillsHtml = '';
        info.dayLeaves.forEach(leave => {
            if (leave.status === 'rejected') return;
            const emp = employees[leave.employeeId] || { name: 'Colleague' };
            const typeClass = getLeaveTypeClass(leave.type, leave.status);
            leavePillsHtml += `
                <div class="month-leave-pill ${typeClass}" 
                     title="${emp.name}: ${leave.type} (${leave.status})\n${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}">
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
    empMonthGridWrapper.innerHTML = html;
}

function getLeaveTypeClass(type, status) {
    if (status === 'pending') return 'leave-pending';
    const settings = window.DB.getSettings();
    const lt = settings.leaveTypes.find(l => l.name === type);
    return lt ? lt.colorClass : 'leave-vacation';
}

function populateLeaveTypes() {
    if (!typeInput) return;
    const settings = window.DB.getSettings();
    typeInput.innerHTML = '<option value="" disabled selected>Select a leave type</option>';
    settings.leaveTypes.forEach(lt => {
        typeInput.innerHTML += `<option value="${lt.name}">${lt.name}</option>`;
    });
}

// 4. Render My Leave Requests & History
function renderRequests() {
    requestListEl.innerHTML = '';
    
    const sorted = [...myRequests].sort((a,b) => b.id - a.id);

    const filtered = sorted.filter(r => {
        if (currentFilter === 'all') return true;
        return r.status === currentFilter;
    });

    if (filtered.length === 0) {
        requestListEl.innerHTML = `
            <div class="empty-state">
                <p>No ${currentFilter === 'all' ? '' : currentFilter} leave requests found.</p>
            </div>
        `;
        return;
    }

    filtered.forEach((req) => {
        const item = document.createElement('div');
        item.className = 'req-item';
        
        let feedbackHtml = '';
        if (req.comment) {
            const fbClass = req.status === 'approved' ? 'feedback-approved' : 'feedback-rejected';
            feedbackHtml = `
                <div class="manager-feedback-box ${fbClass}">
                    <span>💬</span>
                    <span><strong>Manager Note:</strong> "${req.comment}"</span>
                </div>
            `;
        }

        item.innerHTML = `
            <div class="req-header">
                <div>
                    <div class="req-title">${req.type} &bull; ${req.daysRequested} Days</div>
                    <div class="req-dates">${formatDate(req.startDate)} &rarr; ${formatDate(req.endDate)}</div>
                </div>
                <span class="req-status status-${req.status}">${req.status}</span>
            </div>
            <div class="reason-box">
                "${req.reason}"
            </div>
            ${feedbackHtml}
        `;
        requestListEl.appendChild(item);
    });
}

// 5. Date picker setup & real-time conflict/balance preview
function setupDatePickers() {
    const today = new Date().toISOString().split('T')[0];
    startDateInput.min = today;
    endDateInput.min = today;

    startDateInput.addEventListener('change', () => {
        if (startDateInput.value) {
            endDateInput.min = startDateInput.value;
            if (endDateInput.value && endDateInput.value < startDateInput.value) {
                endDateInput.value = startDateInput.value;
            }
        }
        updateRequestPreview();
    });

    endDateInput.addEventListener('change', updateRequestPreview);
    typeInput.addEventListener('change', updateRequestPreview);
}

function updateRequestPreview() {
    if (!startDateInput.value || !endDateInput.value) {
        previewBox.style.display = 'none';
        return;
    }

    const days = calculateDays(startDateInput.value, endDateInput.value);
    previewDurationText.innerText = `Requested Duration: ${days} day${days > 1 ? 's' : ''}`;
    previewBox.style.display = 'block';

    const overlaps = window.DB.getOverlappingAbsences(startDateInput.value, endDateInput.value, currentEmployeeId);
    const employees = window.DB.getEmployees();

    if (overlaps.length > 0) {
        const names = overlaps.map(o => (employees[o.employeeId] ? employees[o.employeeId].name : 'A teammate')).join(', ');
        previewOverlapText.innerText = `ℹ️ Team coverage notice: ${names} is also scheduled away during these dates.`;
        previewOverlapText.style.display = 'block';
    } else {
        previewOverlapText.style.display = 'none';
    }
}

function calculateDays(start, end) {
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end + 'T00:00:00');
    const diffTime = Math.abs(e - s);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function clearErrors() {
    errType.innerText = '';
    errDate.innerText = '';
    errReason.innerText = '';
    
    typeInput.style.borderColor = '';
    startDateInput.style.borderColor = '';
    endDateInput.style.borderColor = '';
    reasonInput.style.borderColor = '';
}

function validateForm() {
    let isValid = true;
    clearErrors();

    if (!typeInput.value) {
        errType.innerText = 'Please select a leave type.';
        typeInput.style.borderColor = 'var(--danger-color)';
        isValid = false;
    }
    
    if (!startDateInput.value || !endDateInput.value) {
        errDate.innerText = 'Please select both start and end dates.';
        if (!startDateInput.value) startDateInput.style.borderColor = 'var(--danger-color)';
        if (!endDateInput.value) endDateInput.style.borderColor = 'var(--danger-color)';
        isValid = false;
    } else if (startDateInput.value > endDateInput.value) {
        errDate.innerText = 'End date cannot be before start date.';
        endDateInput.style.borderColor = 'var(--danger-color)';
        isValid = false;
    } else if (typeInput.value) {
        const days = calculateDays(startDateInput.value, endDateInput.value);
        const available = me.balances[typeInput.value] !== undefined ? me.balances[typeInput.value] : 0;
        if (days > available) {
            errDate.innerText = `Requested ${days} days exceeds your available ${typeInput.value} balance (${available} days remaining).`;
            endDateInput.style.borderColor = 'var(--warning-color)';
            startDateInput.style.borderColor = 'var(--warning-color)';
            isValid = false;
        }
    }

    if (reasonInput.value.trim().length < 10) {
        errReason.innerText = 'Please provide a clear reason (minimum 10 characters).';
        reasonInput.style.borderColor = 'var(--danger-color)';
        isValid = false;
    }

    return isValid;
}

function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) return;

    const days = calculateDays(startDateInput.value, endDateInput.value);
    const settings = window.DB.getSettings();
    const leaveTypeCfg = settings.leaveTypes.find(lt => lt.name === typeInput.value);
    
    // Check auto-approve policies
    let finalStatus = 'pending';
    if (leaveTypeCfg && !leaveTypeCfg.requiresApproval) {
        finalStatus = 'approved';
    } else if (settings.autoApproveThreshold > 0 && days <= settings.autoApproveThreshold) {
        finalStatus = 'approved';
    }

    const newRequest = {
        id: Date.now(),
        employeeId: currentEmployeeId,
        type: typeInput.value,
        startDate: startDateInput.value,
        endDate: endDateInput.value,
        reason: reasonInput.value.trim(),
        status: finalStatus,
        comment: finalStatus === 'approved' ? 'Auto-approved by system policy.' : '',
        daysRequested: days,
        createdAt: new Date().toISOString().split('T')[0]
    };

    // If auto-approved, deduct balance immediately
    if (finalStatus === 'approved') {
        const emp = window.DB.getEmployee(currentEmployeeId);
        if (emp.balances[typeInput.value] !== undefined) {
            emp.balances[typeInput.value] = Math.max(0, emp.balances[typeInput.value] - days);
            window.DB.updateEmployee(currentEmployeeId, emp);
        }
    }

    window.DB.addRequest(newRequest);
    
    // Notify Manager or Employee
    if (finalStatus === 'pending') {
        window.DB.addNotification({
            role: 'manager',
            message: `${me.name} submitted a new ${typeInput.value} request for ${days} days.`,
            type: 'pending'
        });
        showToast('Leave request submitted! Awaiting manager review.');
    } else {
        window.DB.addNotification({
            userId: currentEmployeeId,
            role: 'employee',
            message: `Your ${typeInput.value} request for ${days} days was auto-approved.`,
            type: 'approved'
        });
        showToast('Leave request was auto-approved!');
    }

    loadData();
    renderHeroAndBalances();
    renderRequests();
    renderEmployeeCalendar();
    form.reset();
    previewBox.style.display = 'none';

    const today = new Date().toISOString().split('T')[0];
    endDateInput.min = today;
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toastElem = document.createElement('div');
    toastElem.style.background = 'var(--card-bg)';
    toastElem.style.border = '1px solid var(--border-color)';
    toastElem.style.padding = '1rem 1.25rem';
    toastElem.style.borderRadius = '8px';
    toastElem.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    toastElem.style.color = 'var(--text-main)';
    toastElem.style.fontSize = '0.9rem';
    toastElem.style.display = 'flex';
    toastElem.style.alignItems = 'center';
    toastElem.style.gap = '0.5rem';
    toastElem.style.animation = 'slideIn 0.3s ease-out forwards';
    
    toastElem.innerHTML = `<span>🔔</span> <span>${message}</span>`;
    container.appendChild(toastElem);
    
    setTimeout(() => {
        toastElem.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => toastElem.remove(), 300);
    }, 4000);
}

// 6. Notifications System
function renderNotifications() {
    const notifs = window.DB.getNotifications(currentEmployeeId, 'employee');
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

function setupEventListeners() {
    form.addEventListener('submit', handleSubmit);

    // Employee Switcher
    if (employeeSwitcher) {
        employeeSwitcher.value = currentEmployeeId;
        employeeSwitcher.addEventListener('change', (e) => {
            currentEmployeeId = parseInt(e.target.value, 10);
            loadData();
            renderHeroAndBalances();
            renderTeamAbsences();
            renderRequests();
            renderEmployeeCalendar();
            renderNotifications();
            previewBox.style.display = 'none';
        });
    }

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
            const notifs = window.DB.getNotifications(currentEmployeeId, 'employee');
            notifs.forEach(n => {
                if (!n.read) window.DB.markNotificationAsRead(n.id);
            });
            renderNotifications();
        });
    }

    // Calendar Navigation for Employee
    if (empCalPrev) {
        empCalPrev.addEventListener('click', () => {
            empCalMonth--;
            if (empCalMonth < 0) {
                empCalMonth = 11;
                empCalYear--;
            }
            renderEmployeeCalendar();
        });
    }

    if (empCalNext) {
        empCalNext.addEventListener('click', () => {
            empCalMonth++;
            if (empCalMonth > 11) {
                empCalMonth = 0;
                empCalYear++;
            }
            renderEmployeeCalendar();
        });
    }

    if (empCalToday) {
        empCalToday.addEventListener('click', () => {
            empCalYear = 2026;
            empCalMonth = 9; // October 2026
            renderEmployeeCalendar();
        });
    }

    // Calendar View Toggles
    if (empViewTimelineBtn && empViewMonthBtn) {
        empViewTimelineBtn.addEventListener('click', () => {
            empViewTimelineBtn.classList.add('active');
            empViewMonthBtn.classList.remove('active');
            empCalView = 'timeline';
            empTimelineView.style.display = 'block';
            empMonthView.style.display = 'none';
            renderEmployeeCalendar();
        });

        empViewMonthBtn.addEventListener('click', () => {
            empViewMonthBtn.classList.add('active');
            empViewTimelineBtn.classList.remove('active');
            empCalView = 'month';
            empTimelineView.style.display = 'none';
            empMonthView.style.display = 'block';
            renderEmployeeCalendar();
        });
    }

    // History filter buttons
    histFilterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            histFilterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderRequests();
        });
    });
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

document.addEventListener('DOMContentLoaded', init);
