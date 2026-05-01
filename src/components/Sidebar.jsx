import React from 'react';
import './Sidebar.css';

const NAV = [
  {
    id: 'dashboard', label: 'Dashboard',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  },
  {
    id: 'transactions', label: 'Transactions',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  },
  {
    id: 'savings', label: 'Savings Goals',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
  },
  {
    id: 'profile', label: 'Profile',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  },
];

const Sidebar = ({ currentPage, onNavigate, onLogout, currentUser }) => {
  const firstName = currentUser?.first_name || '';
  const lastName  = currentUser?.last_name  || '';
  const initials  = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">✦</span>
        <div>
          <div className="brand-name">Sanctuary</div>
          <div className="brand-sub">Mindful Finance</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ id, label, icon }) => (
          <button
            key={id}
            className={`nav-item ${currentPage === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {/* User info strip */}
      {currentUser && (
        <div className="sidebar-user" onClick={() => onNavigate('profile')}>
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{firstName} {lastName}</div>
            <div className="sidebar-user-email">{currentUser.email}</div>
          </div>
        </div>
      )}

      <button className="sidebar-logout" onClick={onLogout}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Sign Out
      </button>
    </aside>
  );
};

export default Sidebar;