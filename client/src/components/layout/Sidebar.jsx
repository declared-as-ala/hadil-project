import { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';

const menuItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: '📊',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE, ROLES.STAGIAIRE],
  },
  {
    section: 'HR Management',
    roles: [ROLES.ADMIN, ROLES.RH],
  },
  {
    label: 'Employees',
    path: '/employes',
    icon: '👥',
    roles: [ROLES.ADMIN, ROLES.RH],
  },
  {
    label: 'Absences',
    path: '/absences',
    icon: '📓',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE],
  },
  {
    label: 'Demande Congés',
    path: '/conges',
    icon: '🏖️',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE],
  },
  {
    label: 'Demandes Docs',
    path: '/documents-admin',
    icon: '📂',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE],
  },
  {
    label: 'Heures Sup',
    path: '/heures-sup',
    icon: '⏰',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE],
  },
  {
    label: 'Gestion Paie',
    path: '/paie',
    icon: '💰',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE],
  },
  {
    label: 'AI CV Analyzer',
    path: '/hr/cv-ai',
    icon: '🤖',
    roles: [ROLES.ADMIN, ROLES.RH],
  },
  {
    section: 'Communication',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE, ROLES.STAGIAIRE],
  },
  {
    label: 'Messages',
    path: '/messages',
    icon: '💬',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE, ROLES.STAGIAIRE],
  },
  {
    section: 'Projects',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE],
  },
  {
    label: 'Projects',
    path: '/projets',
    icon: '🚀',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE],
  },
  {
    section: 'Administration',
    roles: [ROLES.ADMIN],
  },
  {
    label: 'Admin ',
    path: '/admin',
    icon: '⚙️',
    roles: [ROLES.ADMIN],
  },
  {
    section: 'Account',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE, ROLES.STAGIAIRE],
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: '👤',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE, ROLES.STAGIAIRE],
  },
];

export default function Sidebar({ collapsed = false, onToggleCollapse = () => {} }) {
  const { role } = useAuth();
  const [filter, setFilter] = useState('');

  const visibleItems = useMemo(
    () => menuItems.filter((item) => item.roles.includes(role)),
    [role]
  );

  // Filter by label. Drop section headers that end up with no matching links
  // beneath them (sections are flat in `menuItems`, so we scan forward to the
  // next section to decide).
  const filteredItems = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return visibleItems;

    const result = [];
    for (let i = 0; i < visibleItems.length; i += 1) {
      const item = visibleItems[i];
      if (item.section) {
        let hasMatch = false;
        for (let j = i + 1; j < visibleItems.length && !visibleItems[j].section; j += 1) {
          if (visibleItems[j].label?.toLowerCase().includes(q)) {
            hasMatch = true;
            break;
          }
        }
        if (hasMatch) result.push(item);
      } else if (item.label?.toLowerCase().includes(q)) {
        result.push(item);
      }
    }
    return result;
  }, [visibleItems, filter]);

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">🏢</span>
          {!collapsed && <span className="sidebar-logo-text">HR System</span>}
        </div>
        <button
          className="sidebar-toggle"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '▶️' : '◀️'}
        </button>
      </div>

      {!collapsed && (
        <div className="sidebar-search">
          <span className="sidebar-search-icon">🔍</span>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter menu..."
            className="sidebar-search-input"
            aria-label="Filter menu"
          />
          {filter && (
            <button
              type="button"
              className="sidebar-search-clear"
              onClick={() => setFilter('')}
              title="Clear filter"
            >
              ×
            </button>
          )}
        </div>
      )}

      <nav className="sidebar-nav">
        {filteredItems.map((item, idx) => {
          if (item.section) {
            return (
              !collapsed && (
                <div key={`section-${idx}`} className="sidebar-section-label">
                  {item.section}
                </div>
              )
            );
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
            </NavLink>
          );
        })}
        {filter && filteredItems.length === 0 && !collapsed && (
          <div className="sidebar-empty">No matches</div>
        )}
      </nav>
    </aside>
  );
}
