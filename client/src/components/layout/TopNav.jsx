import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import LanguageSwitcher from './LanguageSwitcher';
import './TopNav.css';

export default function TopNav({ onMenuToggle }) {
  const { user, logout, role } = useAuth();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
  };

  const userName = user
    ? `${user.nom || user.fullName || ''} ${user.prenom || ''}`.trim() || user.email
    : user?.email || 'User';

  const roleLabel = role ? t(`roles.${role}`, { defaultValue: role }) : '';

  return (
    <header className="topnav">
      <div className="topnav-left">
        <button className="topnav-menu-btn" onClick={onMenuToggle} title="Toggle menu">
          &#9776;
        </button>
      </div>
      <div className="topnav-right">
        <LanguageSwitcher />
        <div className="topnav-user">
          <div className="topnav-user-info">
            <span className="topnav-user-name">{userName}</span>
            <span className="topnav-user-role">{roleLabel}</span>
          </div>
          <Link
            to="/profile"
            className="topnav-avatar"
            title={t('topnav.profile')}
            style={{ textDecoration: 'none', cursor: 'pointer', overflow: 'hidden' }}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              user?.nom?.[0]?.toUpperCase() || user?.fullName?.[0]?.toUpperCase() || 'U'
            )}
          </Link>
          <button className="btn btn-ghost btn-sm topnav-logout" onClick={handleLogout} title={t('topnav.logout')}>
            ⎋
          </button>
        </div>
      </div>
    </header>
  );
}
