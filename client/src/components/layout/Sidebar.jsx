import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';
import { useAuth } from '../../hooks/useAuth';
import { labelFor, menuItems } from './navigation';

export default function Sidebar({ collapsed = false, onToggleCollapse = () => {} }) {
  const { role } = useAuth();

  const visibleItems = useMemo(
    () => menuItems.filter((item) => item.roles.includes(role)),
    [role]
  );

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <rect x="2" y="2" width="9" height="9" rx="2" fill="url(#logoGrad)" />
              <rect x="13" y="2" width="9" height="9" rx="2" fill="url(#logoGrad)" opacity="0.4" />
              <rect x="2" y="13" width="9" height="9" rx="2" fill="url(#logoGrad)" opacity="0.4" />
              <rect x="13" y="13" width="9" height="9" rx="2" fill="url(#logoGrad)" />
            </svg>
          </span>
          {!collapsed && <span className="sidebar-logo-text">RH System</span>}
        </div>
        <button
          className="sidebar-toggle"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      <nav className="sidebar-nav">
        {visibleItems.map((item, idx) => {
          if (item.section) {
            return (
              !collapsed && (
                <div key={`section-${idx}`} className="sidebar-section-label">
                  {labelFor(item)}
                </div>
              )
            );
          }

          const label = labelFor(item);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
              title={collapsed ? label : undefined}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-link-label">{label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
