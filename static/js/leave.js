/* Leave Management Module Frontend Logic */

let currentLeaveBalances = null;
let currentMyLeaves = [];
let currentAllLeaves = [];
let activeApprovalFilter = 'pending';

async function loadLeaveBalances() {
    try {
        const res = await apiRequest('/api/leave/balances');
        currentLeaveBalances = res.balances;
        renderLeaveBalancesUI(currentLeaveBalances);
    } catch (err) {
        console.error("Error loading leave balances:", err);
    }
}

function renderLeaveBalancesUI(b) {
    if (!b) return;

    const setElemText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };
    const setElemWidth = (id, widthPct) => {
        const el = document.getElementById(id);
        if (el) el.style.width = widthPct;
    };

    setElemText('stat-annual-leave', `${b.annual_remaining} / ${b.annual_leave_allocated} Days`);
    setElemText('stat-sick-leave', `${b.sick_remaining} / ${b.sick_leave_allocated} Days`);

    setElemText('bal-annual-rem', b.annual_remaining);
    setElemText('bal-annual-alloc', b.annual_leave_allocated);
    setElemText('bal-annual-used', b.annual_leave_used);
    const annualPct = Math.min(100, Math.round((b.annual_leave_used / (b.annual_leave_allocated || 1)) * 100));
    setElemWidth('bar-annual-leave', `${annualPct}%`);

    setElemText('bal-sick-rem', b.sick_remaining);
    setElemText('bal-sick-alloc', b.sick_leave_allocated);
    setElemText('bal-sick-used', b.sick_leave_used);
    const sickPct = Math.min(100, Math.round((b.sick_leave_used / (b.sick_leave_allocated || 1)) * 100));
    setElemWidth('bar-sick-leave', `${sickPct}%`);

    setElemText('bal-casual-rem', b.casual_remaining);
    setElemText('bal-casual-alloc', b.casual_leave_allocated);
    setElemText('bal-casual-used', b.casual_leave_used);
    const casualPct = Math.min(100, Math.round((b.casual_leave_used / (b.casual_leave_allocated || 1)) * 100));
    setElemWidth('bar-casual-leave', `${casualPct}%`);

    setElemText('bal-maternity-rem', b.maternity_remaining);
    setElemText('bal-maternity-alloc', b.maternity_leave_allocated);
    setElemText('bal-maternity-used', b.maternity_leave_used);
    const matPct = Math.min(100, Math.round((b.maternity_leave_used / (b.maternity_leave_allocated || 1)) * 100));
    setElemWidth('bar-maternity-leave', `${matPct}%`);
}

function openApplyLeaveModal() {
    const today = new Date().toISOString().split('T')[0];
    const startInput = document.getElementById('leave-start-date');
    const endInput = document.getElementById('leave-end-date');

    if (startInput) startInput.value = today;
    if (endInput) endInput.value = today;

    calculateLeaveDays();
    openModal('modal-apply-leave');
}

function calculateLeaveDays() {
    const startVal = document.getElementById('leave-start-date')?.value;
    const endVal = document.getElementById('leave-end-date')?.value;
    const summarySpan = document.getElementById('leave-calculated-days');

    if (!summarySpan) return;

    if (!startVal || !endVal) {
        summarySpan.textContent = '0 Days';
        return;
    }

    const start = new Date(startVal);
    const end = new Date(endVal);

    if (end < start) {
        summarySpan.textContent = 'Invalid range (end date before start)';
        return;
    }

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    summarySpan.textContent = `${diffDays} Day${diffDays > 1 ? 's' : ''}`;
}

async function submitLeaveApplication(e) {
    e.preventDefault();
    const leave_type = document.getElementById('leave-type-select').value;
    const start_date = document.getElementById('leave-start-date').value;
    const end_date = document.getElementById('leave-end-date').value;
    const reason = document.getElementById('leave-reason').value.trim();
    const emergency_contact = document.getElementById('leave-emergency-contact').value.trim();

    const start = new Date(start_date);
    const end = new Date(end_date);
    if (end < start) {
        showToast('End date cannot be earlier than start date.', 'error');
        return;
    }

    const total_days = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;

    try {
        await apiRequest('/api/leave/apply', 'POST', {
            leave_type, start_date, end_date, total_days, reason, emergency_contact
        });
        showToast('Leave request submitted successfully!', 'success');
        closeModal('modal-apply-leave');
        loadLeaveBalances();
        loadMyLeaveHistory();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function loadMyLeaveHistory() {
    try {
        const res = await apiRequest('/api/leave/my-requests');
        currentMyLeaves = res.leave_requests || [];
        renderLeaveHistoryTable();
        renderDashboardRecentLeaves();
    } catch (err) {
        console.error("Error loading leave history:", err);
    }
}

function renderLeaveHistoryTable() {
    const tbody = document.getElementById('leave-history-tbody');
    if (!tbody) return;

    const filterStatus = document.getElementById('filter-leave-status')?.value || 'all';
    let leaves = currentMyLeaves;

    if (filterStatus !== 'all') {
        leaves = leaves.filter(l => l.status === filterStatus);
    }

    if (leaves.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center p-4 text-muted">No leave records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = leaves.map(l => `
        <tr>
            <td><strong class="text-capitalize">${l.leave_type} Leave</strong></td>
            <td>${l.start_date}</td>
            <td>${l.end_date}</td>
            <td><strong>${l.total_days} Day${l.total_days > 1 ? 's' : ''}</strong></td>
            <td><span class="text-muted">${l.reason}</span></td>
            <td><span class="badge badge-${l.status}">${l.status}</span></td>
            <td>
                ${l.reviewer_name ? `<div><small class="text-muted">By ${l.reviewer_name}</small></div>` : ''}
                <small>${l.reviewer_comments || '-'}</small>
            </td>
            <td>
                ${(l.status === 'pending' || l.status === 'approved') ? `
                    <button type="button" class="btn btn-outline btn-sm" onclick="cancelLeaveRequest(${l.id})">
                        <i class="fa-solid fa-ban"></i> Cancel
                    </button>
                ` : '-'}
            </td>
        </tr>
    `).join('');
}

function renderDashboardRecentLeaves() {
    const container = document.getElementById('dash-recent-leaves');
    if (!container) return;

    if (currentMyLeaves.length === 0) {
        container.innerHTML = `<div class="empty-state">No recent leave applications.</div>`;
        return;
    }

    const recent = currentMyLeaves.slice(0, 4);
    container.innerHTML = recent.map(l => `
        <div class="card-item glassmorphic p-3 margin-bottom-xs display-flex justify-between align-center">
            <div>
                <strong>${l.leave_type.toUpperCase()} Leave</strong> (${l.total_days} days)
                <div class="text-muted font-size-xs">${l.start_date} to ${l.end_date}</div>
            </div>
            <span class="badge badge-${l.status}">${l.status}</span>
        </div>
    `).join('');
}

async function cancelLeaveRequest(leaveId) {
    if (!confirm("Are you sure you want to cancel this leave request?")) return;

    try {
        await apiRequest(`/api/leave/${leaveId}/cancel`, 'POST');
        showToast("Leave request cancelled.", 'info');
        loadLeaveBalances();
        loadMyLeaveHistory();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

/* LEAVE APPROVALS WORKFLOW (MANAGERS & ADMINS) */

async function loadAllLeaveApprovals() {
    try {
        const res = await apiRequest('/api/leave/all');
        currentAllLeaves = res.leave_requests || [];

        // Update badge on sidebar
        const pendingCount = currentAllLeaves.filter(l => l.status === 'pending').length;
        const badge = document.getElementById('badge-pending-leaves');
        if (badge) badge.textContent = pendingCount;
        const statPending = document.getElementById('stat-pending-leaves');
        if (statPending) statPending.textContent = `${pendingCount} Request${pendingCount !== 1 ? 's' : ''}`;

        renderLeaveApprovalsTable();
    } catch (err) {
        console.error("Error loading leave approvals:", err);
    }
}

function filterLeaveApprovals(status, btnEl) {
    activeApprovalFilter = status;
    const btns = document.querySelectorAll('.filter-btn');
    btns.forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    renderLeaveApprovalsTable();
}

function renderLeaveApprovalsTable() {
    const tbody = document.getElementById('leave-approval-tbody');
    if (!tbody) return;

    let list = currentAllLeaves;
    if (activeApprovalFilter !== 'all') {
        list = list.filter(l => l.status === activeApprovalFilter);
    }

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center p-4 text-muted">No leave requests matching filter.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(l => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${l.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + l.employee_name}" class="user-avatar-xs">
                    <div>
                        <strong>${l.employee_name}</strong>
                        <div style="font-size: 11px;" class="text-muted">${l.employee_email}</div>
                    </div>
                </div>
            </td>
            <td><span class="badge badge-secondary">${l.department}</span></td>
            <td><strong class="text-capitalize">${l.leave_type} Leave</strong></td>
            <td>${l.start_date} → ${l.end_date}</td>
            <td><strong>${l.total_days} Days</strong></td>
            <td><small class="text-muted">${l.reason}</small></td>
            <td><span class="badge badge-${l.status}">${l.status}</span></td>
            <td>
                ${l.status === 'pending' ? `
                    <div style="display: flex; gap: 6px;">
                        <button type="button" class="btn btn-emerald btn-sm" onclick="reviewLeaveAction(${l.id}, 'approved')">
                            <i class="fa-solid fa-check"></i> Approve
                        </button>
                        <button type="button" class="btn btn-danger btn-sm" onclick="reviewLeaveAction(${l.id}, 'rejected')">
                            <i class="fa-solid fa-xmark"></i> Reject
                        </button>
                    </div>
                ` : `
                    <small class="text-muted">Reviewed by ${l.reviewer_name || 'Admin'}<br>"${l.reviewer_comments || '-'}"</small>
                `}
            </td>
        </tr>
    `).join('');
}

async function reviewLeaveAction(leaveId, status) {
    const comments = prompt(`Enter comments for ${status} decision (optional):`, status === 'approved' ? 'Approved.' : 'Declined.');
    if (comments === null) return;

    try {
        await apiRequest(`/api/leave/${leaveId}/review`, 'PUT', { status, comments });
        showToast(`Leave request ${status}!`, 'success');
        loadAllLeaveApprovals();
    } catch (err) {
        showToast(err.message, 'error');
    }
}
