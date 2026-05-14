import { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Sidebar.css';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';

// Items are flat: `section` entries are headers; everything else is a link.
// Each entry uses an i18n key so labels switch with the language.
const menuItems = [
  { key: 'dashboard', path: '/dashboard', icon: '📊', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE, ROLES.STAGIAIRE] },
  { section: 'hr', roles: [ROLES.ADMIN, ROLES.RH] },
  { key: 'employes', path: '/employes', icon: '👥', roles: [ROLES.ADMIN, ROLES.RH] },
  { key: 'absences', path: '/absences', icon: '📓', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE] },
  { key: 'conges', path: '/conges', icon: '🏖️', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE] },
  { key: 'documents', path: '/documents-admin', icon: '📂', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE] },
  { key: 'heuresSup', path: '/heures-sup', icon: '⏰', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE] },
  { key: 'paie', path: '/paie', icon: '💰', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE] },
  { key: 'cvAi', path: '/hr/cv-ai', icon: '🤖', roles: [ROLES.ADMIN, ROLES.RH] },
  { section: 'communication', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE, ROLES.STAGIAIRE] },
  { key: 'messages', path: '/messages', icon: '💬', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE, ROLES.STAGIAIRE] },
  { section: 'projects', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE] },
  { key: 'projets', path: '/projets', icon: '🚀', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE] },
  { section: 'administration', roles: [ROLES.ADMIN] },
  { key: 'admin', path: '/admin', icon: '⚙️', roles: [ROLES.ADMIN] },
  { section: 'account', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE, ROLES.STAGIAIRE] },
  { key: 'profile', path: '/profile', icon: '👤', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE, ROLES.STAGIAIRE] },
];

export default function Sidebar({ collapsed = false, onToggleCollapse = () => {} }) {
  const { role } = useAuth();
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');

  const labelFor = (item) =>
    item.section ? t(`sidebar.sections.${item.section}`) : t(`sidebar.links.${item.key}`);

  const visibleItems = useMemo(
    () => menuItems.filter((item) => item.roles.includes(role)),
    [role]
  );

  // Filter by translated label. Drop section headers with no matching links.
  const filteredItems = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return visibleItems;

    const result = [];
    for (let i = 0; i < visibleItems.length; i += 1) {
      const item = visibleItems[i];
      if (item.section) {
        let hasMatch = false;
        for (let j = i + 1; j < visibleItems.length && !visibleItems[j].section; j += 1) {
          if (labelFor(visibleItems[j]).toLowerCase().includes(q)) {
            hasMatch = true;
            break;
          }
        }
        if (hasMatch) result.push(item);
      } else if (labelFor(item).toLowerCase().includes(q)) {
        result.push(item);
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleItems, filter, t]);

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">🏢</span>
          {!collapsed && <span className="sidebar-logo-text">{t('sidebar.logo')}</span>}
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
            placeholder={t('sidebar.filterPlaceholder')}
            className="sidebar-search-input"
            aria-label={t('sidebar.filterPlaceholder')}
          />
          {filter && (
            <button
              type="button"
              className="sidebar-search-clear"
              onClick={() => setFilter('')}
              title={t('common.cancel')}
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
        {filter && filteredItems.length === 0 && !collapsed && (
          <div className="sidebar-empty">{t('sidebar.noMatches')}</div>
        )}
      </nav>
    </aside>
  );
}
