import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';

const menuItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: '\uD83D\uDCCA',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE, ROLES.STAGIAIRE],
  },
  {
    section: 'HR Management',
    roles: [ROLES.ADMIN, ROLES.RH],
  },
  {
    label: 'Employees',
    path: '/employes',
    icon: '\uD83D\uDC65',
    roles: [ROLES.ADMIN, ROLES.RH],
  },
  {
    label: 'Interns',
    path: '/stagiaires',
    icon: '\uD83C\uDF93',
    roles: [ROLES.ADMIN, ROLES.RH],
  },
  {
    label: 'Contracts',
    path: '/contrats',
    icon: '\uD83D\uDCC4',
    roles: [ROLES.ADMIN, ROLES.RH],
  },
  {
    section: 'Time Off',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE],
  },
  {
    label: 'Absences',
    path: '/absences',
    icon: '\uD83D\uDDD3\uFE0F',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE],
  },
  {
    label: 'Leave Requests',
    path: '/conges',
    icon: '\uD83C\uDFD6\uFE0F',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE],
  },
  {
    label: 'Overtime',
    path: '/heures-sup',
    icon: '\u23F0',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE],
  },
  {
    section: 'Communication',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE, ROLES.STAGIAIRE],
  },
  {
    label: 'Requests',
    path: '/demandes',
    icon: '\uD83D\uDCE9',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE, ROLES.STAGIAIRE],
  },
  {
    label: 'Messages',
    path: '/messages',
    icon: '\uD83D\uDCAC',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE, ROLES.STAGIAIRE],
  },
  {
    section: 'Projects',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE],
  },
  {
    label: 'Projects',
    path: '/projets',
    icon: '\uD83D\uDE80',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE],
  },
  {
    label: 'Tasks',
    path: '/taches',
    icon: '\u2705',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE],
  },
  {
    label: 'Meetings',
    path: '/reunions',
    icon: '\uD83E\uDDD1\u200D\uD83E\uDDD1\u200D\uD83E\uDDD1',
    roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE],
  },
  {
    section: 'Administration',
    roles: [ROLES.ADMIN],
  },
  {
    label: 'Admin Panel',
    path: '/admin',
    icon: '\u2699\uFE0F',
    roles: [ROLES.ADMIN],
  },
];

export default function Sidebar() {
  const { role } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const canSee = (item) => {
    if (item.section) {
      return item.roles.includes(role);
    }
    return item.roles.includes(role);
  };

  const filteredItems = menuItems.filter(canSee);

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">\uD83C\uFE0F</span>
          {!collapsed && <span className="sidebar-logo-text">HR System</span>}
        </div>
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '\u25B6\uFE0F' : '\u25C0\uFE0F'}
        </button>
      </div>

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
      </nav>
    </aside>
  );
}
