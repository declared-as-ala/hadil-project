import './StatCard.css';

export default function StatCard({ icon, label, value, change, changeType }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${icon}`}>
        {getIcon(icon)}
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {change && (
          <div className={`stat-change ${changeType || ''}`}>
            {changeType === 'up' ? '\u2191' : changeType === 'down' ? '\u2193' : ''} {change}
          </div>
        )}
      </div>
    </div>
  );
}

function getIcon(type) {
  const icons = {
    blue: '📊',
    green: '✅',
    yellow: '⏰',
    red: '❤️',
    purple: '👥',
  };
  return icons[type] || '📋';
}
