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
    blue: '\uD83D\uDCCA',
    green: '\u2705',
    yellow: '\u23F0',
    red: '\u2764\uFE0F',
    purple: '\uD83D\uDC65',
  };
  return icons[type] || '\uD83D\uDCCB';
}
