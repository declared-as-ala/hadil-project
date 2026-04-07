import { useAuth } from '../../hooks/useAuth';
import { ROLE_LABELS } from '../../utils/constants';
import './TopNav.css';

export default function TopNav({ onMenuToggle }) {
  const { user, logout, role } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const userName = user
    ? `${user.nom || user.fullName || ''} ${user.prenom || ''}`.trim() || user.email
    : user?.email || 'User';

  return (
    <header className="topnav">
      <div className="topnav-left">
        <button className="topnav-menu-btn" onClick={onMenuToggle} title="Toggle menu">
          \u2630
        </button>
        <div className="topnav-search">
          <span className="topnav-search-icon">\uD83D\uDD0D</span>
          <input
            type="text"
            placeholder="Search..."
            className="topnav-search-input"
          />
        </div>
      </div>
      <div className="topnav-right">
        <div className="topnav-user">
          <div className="topnav-user-info">
            <span className="topnav-user-name">{userName}</span>
            <span className="topnav-user-role">{ROLE_LABELS[role] || role}</span>
          </div>
          <div className="topnav-avatar">
            {user?.nom?.[0]?.toUpperCase() || user?.fullName?.[0]?.toUpperCase() || 'U'}
          </div>
          <button className="btn btn-ghost btn-sm topnav-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
