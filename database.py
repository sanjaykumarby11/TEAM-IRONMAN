import sqlite3
import os
from werkzeug.security import generate_password_hash

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'system.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'employee')),
            department TEXT NOT NULL,
            designation TEXT NOT NULL,
            phone TEXT,
            avatar_url TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create leave_balances table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS leave_balances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            annual_leave_allocated INTEGER DEFAULT 20,
            annual_leave_used INTEGER DEFAULT 0,
            sick_leave_allocated INTEGER DEFAULT 10,
            sick_leave_used INTEGER DEFAULT 0,
            casual_leave_allocated INTEGER DEFAULT 8,
            casual_leave_used INTEGER DEFAULT 0,
            maternity_leave_allocated INTEGER DEFAULT 90,
            maternity_leave_used INTEGER DEFAULT 0,
            unpaid_leave_used INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    # Create leave_requests table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS leave_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            leave_type TEXT NOT NULL CHECK(leave_type IN ('annual', 'sick', 'casual', 'maternity', 'unpaid')),
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            total_days INTEGER NOT NULL,
            reason TEXT NOT NULL,
            emergency_contact TEXT,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled')),
            reviewed_by INTEGER,
            reviewer_comments TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
        )
    ''')

    # Create tasks table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            created_by INTEGER NOT NULL,
            assigned_to INTEGER NOT NULL,
            priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
            status TEXT DEFAULT 'to_do' CHECK(status IN ('to_do', 'in_progress', 'in_review', 'completed', 'blocked')),
            progress_percent INTEGER DEFAULT 0,
            due_date TEXT NOT NULL,
            department TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    # Create task_comments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS task_comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            comment TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    # Create notifications table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'system' CHECK(type IN ('leave', 'task', 'system')),
            is_read INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    conn.commit()

    # Check if seed data is needed
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        seed_data(conn)

    conn.close()

def seed_data(conn):
    cursor = conn.cursor()
    
    # Passwords hashed
    admin_pw = generate_password_hash("Admin@123")
    manager_pw = generate_password_hash("Manager@123")
    employee_pw = generate_password_hash("Employee@123")
    
    users_data = [
        ("Sarah Jenkins", "admin@company.com", admin_pw, "admin", "HR & Management", "Chief HR Officer", "+1 555-0101", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"),
        ("Marcus Vance", "manager@company.com", manager_pw, "manager", "Engineering", "Lead Tech Architect", "+1 555-0102", "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150"),
        ("Alex Rivera", "employee@company.com", employee_pw, "employee", "Engineering", "Senior Full-Stack Engineer", "+1 555-0103", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"),
        ("Elena Rostova", "elena@company.com", employee_pw, "employee", "Design", "Lead UI/UX Designer", "+1 555-0104", "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150"),
        ("David Chen", "david@company.com", employee_pw, "employee", "Marketing", "Growth Strategist", "+1 555-0105", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"),
        ("Priya Patel", "priya@company.com", manager_pw, "manager", "Design", "Design Director", "+1 555-0106", "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150")
    ]

    cursor.executemany('''
        INSERT INTO users (name, email, password_hash, role, department, designation, phone, avatar_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', users_data)

    # Add leave balances for each user
    cursor.execute("SELECT id FROM users")
    user_ids = [row[0] for row in cursor.fetchall()]
    
    for uid in user_ids:
        cursor.execute('''
            INSERT INTO leave_balances (user_id, annual_leave_allocated, annual_leave_used, sick_leave_allocated, sick_leave_used, casual_leave_allocated, casual_leave_used)
            VALUES (?, 20, ?, 10, ?, 8, ?)
        ''', (uid, 3 if uid == 3 else 1, 2 if uid == 3 else 0, 1))

    # Seed leave requests
    # User 3 (Alex Rivera)
    cursor.execute('''
        INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, total_days, reason, emergency_contact, status, reviewed_by, reviewer_comments)
        VALUES 
        (3, 'annual', '2026-08-10', '2026-08-12', 3, 'Summer family trip and vacation', '+1 555-9999', 'approved', 2, 'Approved. Enjoy your time off!'),
        (3, 'sick', '2026-09-02', '2026-09-03', 2, 'Severe seasonal fever and doctor visit', '+1 555-9999', 'approved', 2, 'Get well soon!'),
        (3, 'casual', '2026-10-05', '2026-10-06', 2, 'Personal urgent family matter', '+1 555-9999', 'pending', NULL, NULL),
        (4, 'annual', '2026-10-12', '2026-10-16', 5, 'Attending international design conference', '+1 555-8888', 'pending', NULL, NULL)
    ''')

    # Seed tasks
    # Manager Marcus Vance (ID 2) creates tasks for Alex (ID 3), Elena (ID 4), David (ID 5)
    tasks_data = [
        ("Implement JWT Authentication Module", "Build secure login/logout REST API endpoints with token authorization and RBAC checks.", 2, 3, "high", "completed", 100, "2026-09-25", "Engineering"),
        ("Design Dynamic Leave Request Dashboard", "Create responsive SVG analytics cards, leave history timeline, and quick filter controls.", 2, 4, "urgent", "in_progress", 75, "2026-09-30", "Design"),
        ("Refactor SQLite Database Schema & Indexes", "Add foreign key cascades, date validation triggers, and indexes for task status queries.", 2, 3, "medium", "in_progress", 45, "2026-10-02", "Engineering"),
        ("Marketing Campaign Analytics Integration", "Develop backend endpoints to aggregate user engagement reports and export CSV summaries.", 2, 5, "low", "to_do", 0, "2026-10-10", "Marketing"),
        ("Conduct End-to-End System QA Testing", "Execute automated test suits for authentication, leave approval flow, and task updates.", 1, 3, "urgent", "to_do", 10, "2026-10-05", "HR & Management")
    ]

    cursor.executemany('''
        INSERT INTO tasks (title, description, created_by, assigned_to, priority, status, progress_percent, due_date, department)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', tasks_data)

    # Seed task comments
    cursor.execute('''
        INSERT INTO task_comments (task_id, user_id, comment)
        VALUES 
        (1, 3, 'JWT authentication with token verification complete. Middleware added.'),
        (1, 2, 'Great work Alex! Tested token expiration and refresh flow.'),
        (2, 4, 'Wireframes finished. Implementing glassmorphic UI components now.'),
        (3, 3, 'Added database indices for user_id and task status.')
    ''')

    # Seed notifications
    cursor.execute('''
        INSERT INTO notifications (user_id, title, message, type, is_read)
        VALUES 
        (3, 'Leave Approved', 'Your annual leave request for Aug 10 - Aug 12 was approved by Marcus Vance.', 'leave', 1),
        (3, 'New Task Assigned', 'Marcus Vance assigned you a new urgent task: Conduct End-to-End System QA Testing.', 'task', 0),
        (4, 'Leave Submitted', 'Your leave request for Oct 12 - Oct 16 is pending manager review.', 'leave', 0),
        (2, 'Pending Leave Review', 'Alex Rivera submitted a new casual leave request requiring your approval.', 'leave', 0)
    ''')

    conn.commit()

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully with seed data.")
