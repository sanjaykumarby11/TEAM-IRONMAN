// store.js - Central data store using localStorage with team coordination & calendar support

const DB_VERSION = '7';

const defaultEmployees = {
    "1": {
        id: 1,
        name: "Alex Mercer",
        role: "Frontend Developer",
        department: "Engineering",
        avatar: "https://i.pravatar.cc/150?img=12",
        balances: {
            "Vacation": 12,
            "Sick Leave": 5,
            "Personal Leave": 2
        }
    },
    "2": {
        id: 2,
        name: "Sarah Chen",
        role: "Product Designer",
        department: "Design",
        avatar: "https://i.pravatar.cc/150?img=5",
        balances: {
            "Vacation": 8,
            "Sick Leave": 3,
            "Personal Leave": 1
        }
    },
    "3": {
        id: 3,
        name: "Marcus Johnson",
        role: "Backend Engineer",
        department: "Engineering",
        avatar: "https://i.pravatar.cc/150?img=33",
        balances: {
            "Vacation": 6,
            "Sick Leave": 4,
            "Personal Leave": 3
        }
    }
};

const defaultRequests = [
    {
        id: 101,
        employeeId: 2,
        type: "Sick Leave",
        startDate: "2026-10-08",
        endDate: "2026-10-09",
        reason: "Seasonal flu recovery as prescribed by doctor.",
        status: "approved",
        comment: "Get well soon, Sarah! Rest up.",
        daysRequested: 2,
        createdAt: "2026-10-06"
    },
    {
        id: 102,
        employeeId: 3,
        type: "Vacation",
        startDate: "2026-10-12",
        endDate: "2026-10-16",
        reason: "Annual family camping and hiking trip in Yosemite National Park.",
        status: "approved",
        comment: "Approved! Sprint tasks handed off to DevOps team.",
        daysRequested: 5,
        createdAt: "2026-09-28"
    },
    {
        id: 103,
        employeeId: 1,
        type: "Vacation",
        startDate: "2026-10-20",
        endDate: "2026-10-24",
        reason: "Visiting family out of town for nephew's birthday celebration.",
        status: "pending",
        comment: "",
        daysRequested: 5,
        createdAt: "2026-10-06"
    },
    {
        id: 104,
        employeeId: 2,
        type: "Personal Leave",
        startDate: "2026-10-23",
        endDate: "2026-10-24",
        reason: "Attending design systems conference in San Francisco.",
        status: "approved",
        comment: "Approved! Looking forward to knowledge sharing after.",
        daysRequested: 2,
        createdAt: "2026-10-01"
    },
    {
        id: 105,
        employeeId: 3,
        type: "Personal Leave",
        startDate: "2026-10-29",
        endDate: "2026-10-30",
        reason: "Home relocation and utility setup.",
        status: "approved",
        comment: "Take care and good luck with the move!",
        daysRequested: 2,
        createdAt: "2026-10-02"
    },
    {
        id: 106,
        employeeId: 1,
        type: "Personal Leave",
        startDate: "2026-09-14",
        endDate: "2026-09-15",
        reason: "Moving apartments.",
        status: "approved",
        comment: "Approved.",
        daysRequested: 2,
        createdAt: "2026-09-02"
    },
    {
        id: 107,
        employeeId: 1,
        type: "Vacation",
        startDate: "2026-08-10",
        endDate: "2026-08-14",
        reason: "Summer beach trip with friends.",
        status: "rejected",
        comment: "Critical v2.0 release sprint during those dates. Please reschedule.",
        daysRequested: 5,
        createdAt: "2026-07-25"
    }
];

const defaultTasks = [
    {
        id: 201,
        title: "Update Design System",
        assigneeId: 2,
        startDate: "2026-10-05",
        endDate: "2026-10-07",
        status: "in-progress"
    }
];

// Initialize DB if empty or version mismatch
if (!localStorage.getItem('employees') || localStorage.getItem('db_version') !== DB_VERSION) {
    localStorage.setItem('employees', JSON.stringify(defaultEmployees));
    localStorage.setItem('requests', JSON.stringify(defaultRequests));
    localStorage.setItem('tasks', JSON.stringify(defaultTasks));
    localStorage.setItem('db_version', DB_VERSION);
}

// Fallback initialization for tasks if upgrading from v4
if (!localStorage.getItem('tasks')) {
    localStorage.setItem('tasks', JSON.stringify(defaultTasks));
}

// Fallback initialization for notifications if upgrading from v5
if (!localStorage.getItem('notifications')) {
    localStorage.setItem('notifications', JSON.stringify([]));
}

const defaultSettings = {
    accrualPolicy: 'annual', // 'annual' or 'monthly'
    autoApproveThreshold: 0, // Auto-approve requests <= X days (0 = disabled)
    leaveTypes: [
        { id: 'vacation', name: 'Vacation', defaultAllowance: 15, requiresApproval: true, colorClass: 'leave-vacation' },
        { id: 'sick', name: 'Sick Leave', defaultAllowance: 10, requiresApproval: true, colorClass: 'leave-sick' },
        { id: 'personal', name: 'Personal Leave', defaultAllowance: 3, requiresApproval: false, colorClass: 'leave-personal' },
        { id: 'bereavement', name: 'Bereavement', defaultAllowance: 5, requiresApproval: false, colorClass: 'leave-pending' }
    ]
};

// Fallback initialization for settings if upgrading to v7
if (!localStorage.getItem('settings')) {
    localStorage.setItem('settings', JSON.stringify(defaultSettings));
}

window.DB = {
    getEmployees: () => JSON.parse(localStorage.getItem('employees') || '{}'),
    getEmployee: (id) => {
        const emps = JSON.parse(localStorage.getItem('employees') || '{}');
        return emps[id] || null;
    },
    updateEmployee: (id, data) => {
        const emps = JSON.parse(localStorage.getItem('employees') || '{}');
        emps[id] = data;
        localStorage.setItem('employees', JSON.stringify(emps));
    },
    getRequests: () => JSON.parse(localStorage.getItem('requests') || '[]'),
    updateRequest: (id, data) => {
        let reqs = JSON.parse(localStorage.getItem('requests') || '[]');
        reqs = reqs.map(r => r.id === id ? data : r);
        localStorage.setItem('requests', JSON.stringify(reqs));
    },
    addRequest: (data) => {
        const reqs = JSON.parse(localStorage.getItem('requests') || '[]');
        reqs.push(data);
        localStorage.setItem('requests', JSON.stringify(reqs));
    },
    getUpcomingAbsences: () => {
        const reqs = JSON.parse(localStorage.getItem('requests') || '[]');
        const today = new Date().toISOString().split('T')[0];
        return reqs
            .filter(r => r.status === 'approved' && r.endDate >= today)
            .sort((a, b) => a.startDate.localeCompare(b.startDate));
    },
    getEmployeeHistory: (employeeId) => {
        const reqs = JSON.parse(localStorage.getItem('requests') || '[]');
        return reqs
            .filter(r => r.employeeId == employeeId)
            .sort((a, b) => b.id - a.id);
    },
    getOverlappingAbsences: (startDate, endDate, excludeEmployeeId = null) => {
        const reqs = JSON.parse(localStorage.getItem('requests') || '[]');
        return reqs.filter(r => {
            if (r.status !== 'approved') return false;
            if (excludeEmployeeId && r.employeeId == excludeEmployeeId) return false;
            return (r.startDate <= endDate && r.endDate >= startDate);
        });
    },
    getLeavesForMonth: (year, month) => {
        // month is 0-indexed (0 for Jan, 9 for Oct)
        const reqs = JSON.parse(localStorage.getItem('requests') || '[]');
        const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        
        return reqs.filter(r => {
            return (r.startDate <= monthEnd && r.endDate >= monthStart);
        });
    },
    getTasks: () => JSON.parse(localStorage.getItem('tasks') || '[]'),
    addTask: (data) => {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        tasks.push(data);
        localStorage.setItem('tasks', JSON.stringify(tasks));
    },
    updateTask: (id, data) => {
        let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        tasks = tasks.map(t => t.id === id ? data : t);
        localStorage.setItem('tasks', JSON.stringify(tasks));
    },
    getNotifications: (userId = null, role = null) => {
        const notifs = JSON.parse(localStorage.getItem('notifications') || '[]');
        return notifs.filter(n => {
            if (userId && n.userId !== userId) return false;
            if (role && n.role !== role) return false;
            return true;
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    addNotification: (data) => {
        const notifs = JSON.parse(localStorage.getItem('notifications') || '[]');
        notifs.push({
            id: Date.now(),
            read: false,
            createdAt: new Date().toISOString(),
            ...data
        });
        localStorage.setItem('notifications', JSON.stringify(notifs));
    },
    markNotificationAsRead: (id) => {
        let notifs = JSON.parse(localStorage.getItem('notifications') || '[]');
        notifs = notifs.map(n => n.id === id ? { ...n, read: true } : n);
        localStorage.setItem('notifications', JSON.stringify(notifs));
    },
    getSettings: () => {
        return JSON.parse(localStorage.getItem('settings')) || defaultSettings;
    },
    updateSettings: (data) => {
        localStorage.setItem('settings', JSON.stringify(data));
    }
};
