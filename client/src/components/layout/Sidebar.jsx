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
  //{
  //label: 'Stagiaires',
  //path: '/stagiaires',
  //icon: '🎓',
  //roles: [ROLES.ADMIN, ROLES.RH],
  //},
  //{
  //label: 'Contracts',
  //path: '/contrats',
  //icon: '📄',
  //roles: [ROLES.ADMIN, ROLES.RH],
  //},
  //{
  //section: 'Time Off',
  //roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE],
  //},
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
  //{
  //label: 'Réclamations',
  //path: '/demandes',
  // icon: '📩',
  //roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE, ROLES.STAGIAIRE],
  //},
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
  //{
  //label: 'Taches',
  //path: '/taches',
  //icon: '✅',
  //roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE],
  //},
  // {
  // label: 'Reunions',
  //path: '/reunions',
  //icon: '👨‍👨',
  //roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE],
  //},
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
          <span className="sidebar-logo-icon">🏢</span>
          {!collapsed && <span className="sidebar-logo-text">HR System</span>}
        </div>
        <button
          className="sidebar-toggle"
          onClick={onToggleCollapse}
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
