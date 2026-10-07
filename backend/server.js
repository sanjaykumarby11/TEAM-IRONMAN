const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, "employee_leave.db");
const JWT_SECRET = process.env.JWT_SECRET || "employee-leave-management-demo-secret";
const UPLOAD_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, UPLOAD_DIR),
  filename: (req, file, callback) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname.replace(/\s+/g, "-")}`;
    callback(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error("Only PDF, JPG, PNG, DOC, and DOCX files are allowed."));
    }
  }
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS employees (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          employee_id TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          department TEXT NOT NULL,
          phone TEXT NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'employee'
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS leave_balances (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_id INTEGER UNIQUE NOT NULL,
          total_leave INTEGER NOT NULL,
          used_leave INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (employee_id) REFERENCES employees(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS leave_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_id INTEGER NOT NULL,
          leave_type TEXT NOT NULL,
          from_date TEXT NOT NULL,
          to_date TEXT NOT NULL,
          reason TEXT NOT NULL,
          attachment TEXT,
          status TEXT NOT NULL DEFAULT 'Pending',
          manager_comment TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (employee_id) REFERENCES employees(id)
        )
      `);

      db.run(`CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id)`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

function generateToken(user) {
  return jwt.sign({ id: user.id, employeeId: user.employee_id, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token." });
    }
    req.user = decoded;
    next();
  });
}

function requireManager(req, res, next) {
  if (req.user.role !== "manager") {
    return res.status(403).json({ message: "Manager access required." });
  }
  next();
}

function calculateLeaveDays(fromDate, toDate) {
  const start = new Date(`${fromDate}T00:00:00`);
  const end = new Date(`${toDate}T00:00:00`);
  const diffInMilliseconds = end.getTime() - start.getTime();
  const days = diffInMilliseconds / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.round(days) + 1);
}

async function createDefaultData() {
  const employeeExists = await get("SELECT id FROM employees WHERE employee_id = ?", ["employee"]);
  if (!employeeExists) {
    const employeePassword = await bcrypt.hash("1234", 10);
    const managerPassword = await bcrypt.hash("1234", 10);

    const employee = await run(
      "INSERT INTO employees (name, employee_id, email, department, phone, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ["Demo Employee", "employee", "employee@example.com", "Development", "9876543210", employeePassword, "employee"]
    );
    await run("INSERT INTO leave_balances (employee_id, total_leave, used_leave) VALUES (?, ?, ?)", [employee.id, 20, 0]);

    await run(
      "INSERT INTO employees (name, employee_id, email, department, phone, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ["Demo Manager", "manager", "manager@example.com", "Human Resources", "9876543211", managerPassword, "manager"]
    );
  }
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, employeeId, email, department, phone, password, confirmPassword } = req.body;

    if (!name || !employeeId || !email || !department || !phone || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }
    if (password.length < 4) {
      return res.status(400).json({ message: "Password must be at least 4 characters long." });
    }

    const existingEmployee = await get("SELECT id FROM employees WHERE employee_id = ? OR email = ?", [employeeId, email]);
    if (existingEmployee) {
      return res.status(409).json({ message: "An employee with this ID or email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const employee = await run(
      "INSERT INTO employees (name, employee_id, email, department, phone, password, role) VALUES (?, ?, ?, ?, ?, ?, 'employee')",
      [name.trim(), employeeId.trim(), email.trim().toLowerCase(), department.trim(), phone.trim(), passwordHash]
    );

    await run("INSERT INTO leave_balances (employee_id, total_leave, used_leave) VALUES (?, ?, ?)", [employee.id, 20, 0]);

    res.status(201).json({ message: "Registration successful. Please log in." });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Unable to register employee." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Employee ID or email and password are required." });
    }

    const employee = await get(
      "SELECT * FROM employees WHERE employee_id = ? OR email = ?",
      [identifier.trim(), identifier.trim().toLowerCase()]
    );

    if (!employee) {
      return res.status(401).json({ message: "Invalid employee ID or password." });
    }

    const isPasswordValid = await bcrypt.compare(password, employee.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid employee ID or password." });
    }

    const token = generateToken(employee);
    res.json({ token, user: { id: employee.id, name: employee.name, employeeId: employee.employee_id, role: employee.role } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed." });
  }
});

app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    const employee = await get("SELECT id, name, employee_id, email, department, phone, role FROM employees WHERE id = ?", [req.user.id]);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }
    res.json(employee);
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Unable to load profile." });
  }
});

app.put("/api/profile", authenticateToken, async (req, res) => {
  try {
    const { name, email, department, phone } = req.body;
    if (!name || !email || !department || !phone) {
      return res.status(400).json({ message: "Name, email, department, and phone are required." });
    }

    const existing = await get("SELECT id FROM employees WHERE email = ? AND id != ?", [email.trim().toLowerCase(), req.user.id]);
    if (existing) {
      return res.status(409).json({ message: "Another employee already uses this email." });
    }

    await run("UPDATE employees SET name = ?, email = ?, department = ?, phone = ? WHERE id = ?", [name.trim(), email.trim().toLowerCase(), department.trim(), phone.trim(), req.user.id]);
    res.json({ message: "Profile updated successfully." });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Unable to update profile." });
  }
});

app.get("/api/dashboard", authenticateToken, async (req, res) => {
  try {
    const balance = await get("SELECT total_leave, used_leave FROM leave_balances WHERE employee_id = ?", [req.user.id]);
    if (!balance) {
      return res.status(404).json({ message: "Leave balance not found." });
    }

    const pending = await get("SELECT COUNT(*) AS count FROM leave_requests WHERE employee_id = ? AND status = 'Pending'", [req.user.id]);
    const remaining = Math.max(balance.total_leave - balance.used_leave, 0);

    res.json({
      totalLeave: balance.total_leave,
      usedLeave: balance.used_leave,
      remainingLeave: remaining,
      pendingRequests: pending.count
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Unable to load dashboard." });
  }
});

app.post("/api/leaves", authenticateToken, upload.single("attachment"), async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, reason } = req.body;
    if (!leaveType || !fromDate || !toDate || !reason) {
      return res.status(400).json({ message: "Leave type, dates, and reason are required." });
    }

    const leaveDays = calculateLeaveDays(fromDate, toDate);
    const balance = await get("SELECT total_leave, used_leave FROM leave_balances WHERE employee_id = ?", [req.user.id]);
    const remaining = balance.total_leave - balance.used_leave;

    if (leaveDays > remaining) {
      return res.status(400).json({ message: `You can apply for at most ${remaining} leave day(s).` });
    }

    const attachment = req.file ? req.file.filename : null;
    const request = await run(
      "INSERT INTO leave_requests (employee_id, leave_type, from_date, to_date, reason, attachment, status, manager_comment, created_at) VALUES (?, ?, ?, ?, ?, ?, 'Pending', NULL, ?)",
      [req.user.id, leaveType, fromDate, toDate, reason.trim(), attachment, new Date().toISOString()]
    );

    res.status(201).json({ message: "Leave request submitted successfully.", id: request.id });
  } catch (error) {
    console.error("Leave request error:", error);
    res.status(500).json({ message: "Unable to submit leave request." });
  }
});

app.get("/api/leaves", authenticateToken, async (req, res) => {
  try {
    const filter = (req.query.status || "all").toLowerCase();
    let sql = "SELECT id, leave_type, from_date, to_date, reason, attachment, status, manager_comment, created_at FROM leave_requests WHERE employee_id = ?";
    const params = [req.user.id];

    if (filter !== "all") {
      sql += " AND status = ?";
      params.push(filter.charAt(0).toUpperCase() + filter.slice(1));
    }

    sql += " ORDER BY created_at DESC";
    const leaves = await all(sql, params);
    res.json(leaves);
  } catch (error) {
    console.error("Leave listing error:", error);
    res.status(500).json({ message: "Unable to load leave history." });
  }
});

app.get("/api/manager/leaves", authenticateToken, requireManager, async (req, res) => {
  try {
    const rows = await all(`
      SELECT lr.id, lr.leave_type, lr.from_date, lr.to_date, lr.reason, lr.status, lr.manager_comment, lr.created_at,
             e.name AS employee_name, e.employee_id
      FROM leave_requests lr
      INNER JOIN employees e ON e.id = lr.employee_id
      WHERE lr.status = 'Pending'
      ORDER BY lr.created_at ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Manager leave list error:", error);
    res.status(500).json({ message: "Unable to load pending leaves." });
  }
});

app.put("/api/manager/leaves/:id", authenticateToken, requireManager, async (req, res) => {
  try {
    const { status, managerComment } = req.body;
    if (!status || !["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "A valid status is required." });
    }

    const leaveRequest = await get("SELECT * FROM leave_requests WHERE id = ?", [req.params.id]);
    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found." });
    }

    if (leaveRequest.status !== "Pending") {
      return res.status(400).json({ message: "Only pending leave requests can be changed." });
    }

    await run("UPDATE leave_requests SET status = ?, manager_comment = ? WHERE id = ?", [status, managerComment || null, req.params.id]);

    if (status === "Approved") {
      const balance = await get("SELECT total_leave, used_leave FROM leave_balances WHERE employee_id = ?", [leaveRequest.employee_id]);
      const days = calculateLeaveDays(leaveRequest.from_date, leaveRequest.to_date);
      const newUsedLeave = balance.used_leave + days;
      if (newUsedLeave > balance.total_leave) {
        await run("UPDATE leave_requests SET status = 'Rejected', manager_comment = ? WHERE id = ?", ["Approved action was rejected because the employee no longer has enough leave balance.", req.params.id]);
        return res.status(400).json({ message: "The employee does not have enough leave balance for this approval." });
      }
      await run("UPDATE leave_balances SET used_leave = ? WHERE employee_id = ?", [newUsedLeave, leaveRequest.employee_id]);
      return res.json({ message: "Leave request approved and leave balance updated." });
    }

    res.json({ message: "Leave request rejected." });
  } catch (error) {
    console.error("Manager update error:", error);
    res.status(500).json({ message: "Unable to update leave request." });
  }
});

app.use("/uploads", express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message || "Invalid request." });
  }
  next();
});

initializeDatabase()
  .then(createDefaultData)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Employee Leave Management System running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });

module.exports = { app, initializeDatabase, createDefaultData, calculateLeaveDays };
