import './StatCard.css';

const ICONS = {
  blue: '⚡',
  green: '💵',
  yellow: '⚠️',
  orange: '📁',
  red: '🚫',
  purple: '👥',
};

export default function StatCard({ icon = 'blue', label, value, symbol, change, changeType = 'up' }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${icon}`} aria-hidden="true">
        {symbol || ICONS[icon] || ICONS.blue}
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {change && (
          <div className={`stat-change ${changeType}`}>
            <span>{changeType === 'up' ? '+' : '-'}</span>
            {change}
          </div>
        )}
      </div>
    </div>
  );
}

