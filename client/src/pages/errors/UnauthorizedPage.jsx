import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--gray-900)', marginBottom: 8 }}>
          Access Denied
        </h1>
        <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <Link to="/dashboard" className="btn btn-primary">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
