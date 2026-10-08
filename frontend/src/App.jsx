import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Link, useLocation, useParams, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Users, Settings, LogOut, Search, Filter, ArrowLeft, MessageSquare, Clock, Calendar } from 'lucide-react';
import './index.css';

const API_URL = 'http://localhost:8000';

const Sidebar = ({ user, onLogout }) => {
  return (
    <aside className="sidebar">
      <a href="/" className="sidebar-logo">
        <LayoutDashboard className="icon" size={28} />
        <span>Ironman HQ</span>
      </a>
      
      <nav className="nav-links">
        {user?.role === 'admin' || user?.role === 'manager' ? (
          <>
            <NavLink to="/admin" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              Admin Dashboard
            </NavLink>
            <NavLink to="/tasks" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <CheckSquare size={20} />
              Task Management
            </NavLink>
            <NavLink to="/employees" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={20} />
              Employee Directory
            </NavLink>
            <NavLink to="/leaves-admin" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Calendar size={20} />
              Leave Approvals
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/employee-dashboard" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              My Dashboard
            </NavLink>
            <NavLink to="/my-tasks" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <CheckSquare size={20} />
              My Tasks
            </NavLink>
            <NavLink to="/my-leaves" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Calendar size={20} />
              My Leaves
            </NavLink>
          </>
        )}
      </nav>
      
      <div className="user-mini" style={{ cursor: 'pointer' }} onClick={onLogout}>
        <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=random`} alt={user?.name} className="avatar" />
        <div className="user-mini-info" style={{ flex: 1 }}>
          <h4>{user?.name}</h4>
          <p>{user?.role}</p>
        </div>
        <LogOut size={16} />
      </div>
    </aside>
  );
};

// --- Authentication ---
const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const user = await res.json();
        onLogin(user);
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Server error');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw' }}>
      <div className="glass-panel" style={{ padding: '3rem', width: '400px', maxWidth: '90%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Welcome to Ironman HQ</h2>
        {error && <div style={{ background: 'var(--danger)', color: 'white', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input type="text" className="form-control" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Sign In</button>
        </form>
        <p className="text-secondary" style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>Try <strong>admin/password</strong> or <strong>alex/password</strong></p>
      </div>
    </div>
  );
};

// --- Admin Views ---
const AdminDashboard = () => {
  const [tasks, setTasks] = useState([]);
  
  useEffect(() => {
    fetch(`${API_URL}/tasks`).then(res => res.json()).then(setTasks);
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <button className="btn btn-primary">Generate Report</button>
      </div>
      
      <div className="dashboard-grid">
        <div className="glass-panel stat-card">
          <div><p className="stat-label">Total Tasks</p><h2 className="stat-value">{tasks.length}</h2></div>
          <div className="stat-icon"><CheckSquare size={24} color="#3b82f6" /></div>
        </div>
        <div className="glass-panel stat-card">
          <div><p className="stat-label">Active Employees</p><h2 className="stat-value">3</h2></div>
          <div className="stat-icon"><Users size={24} color="#10b981" /></div>
        </div>
        <div className="glass-panel stat-card">
          <div><p className="stat-label">Pending Leaves</p><h2 className="stat-value">1</h2></div>
          <div className="stat-icon"><Calendar size={24} color="#f59e0b" /></div>
        </div>
      </div>
    </div>
  );
};

const LeaveApprovals = () => {
  const [leaves, setLeaves] = useState([]);
  
  useEffect(() => {
    fetch(`${API_URL}/leaves`).then(res => res.json()).then(setLeaves);
  }, []);

  const handleStatus = async (id, status) => {
    await fetch(`${API_URL}/leaves/${id}/status?status=${status}`, { method: 'PUT' });
    const res = await fetch(`${API_URL}/leaves`);
    const data = await res.json();
    setLeaves(data);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Leave Approvals</h1>
      </div>
      <div className="task-list">
        {leaves.map(leave => (
          <div key={leave.id} className="glass-panel task-item" style={{ borderRadius: '12px' }}>
            <div className="task-info">
              <h4 className="task-title">Leave Request from User {leave.employee_id}</h4>
              <div className="task-meta">
                <span>📅 {leave.start_date} to {leave.end_date}</span>
                <span>Reason: {leave.reason}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className={`badge ${leave.status}`}>{leave.status}</span>
              {leave.status === 'pending' && (
                <>
                  <button className="btn btn-primary" onClick={() => handleStatus(leave.id, 'approved')}>Approve</button>
                  <button className="btn btn-secondary" onClick={() => handleStatus(leave.id, 'rejected')}>Reject</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Employee Views ---
const EmployeeDashboard = ({ user }) => (
  <div className="page-container">
    <div className="page-header">
      <h1>Welcome back, {user?.name}</h1>
    </div>
    <div className="dashboard-grid">
      <div className="glass-panel stat-card">
        <div><p className="stat-label">My Open Tasks</p><h2 className="stat-value">1</h2></div>
        <div className="stat-icon"><CheckSquare size={24} color="#3b82f6" /></div>
      </div>
      <div className="glass-panel stat-card">
        <div><p className="stat-label">Remaining Leave Days</p><h2 className="stat-value">18</h2></div>
        <div className="stat-icon"><Calendar size={24} color="#10b981" /></div>
      </div>
    </div>
  </div>
);

const MyLeaves = ({ user }) => {
  const [leaves, setLeaves] = useState([]);
  
  useEffect(() => {
    fetch(`${API_URL}/leaves`).then(res => res.json()).then(data => {
      setLeaves(data.filter(l => l.employee_id === user.id));
    });
  }, [user.id]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Leaves</h1>
        <button className="btn btn-primary">+ Request Leave</button>
      </div>
      <div className="task-list">
        {leaves.map(leave => (
          <div key={leave.id} className="glass-panel task-item" style={{ borderRadius: '12px' }}>
            <div className="task-info">
              <h4 className="task-title">{leave.reason}</h4>
              <div className="task-meta">
                <span>📅 {leave.start_date} to {leave.end_date}</span>
              </div>
            </div>
            <span className={`badge ${leave.status}`}>{leave.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar user={user} onLogout={() => setUser(null)} />
        <main className="main-content">
          <Routes>
            {user.role === 'admin' || user.role === 'manager' ? (
              <>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/leaves-admin" element={<LeaveApprovals />} />
                <Route path="*" element={<Navigate to="/admin" />} />
              </>
            ) : (
              <>
                <Route path="/employee-dashboard" element={<EmployeeDashboard user={user} />} />
                <Route path="/my-leaves" element={<MyLeaves user={user} />} />
                <Route path="*" element={<Navigate to="/employee-dashboard" />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
