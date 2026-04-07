import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { employesAPI } from '../../api/employes.api';
import { stagiairesAPI } from '../../api/stagiaires.api';
import { projetsAPI } from '../../api/projets.api';
import { useApiToast } from '../../components/common/Toast';
import StatCard from '../../components/common/StatCard';
import { ROLES } from '../../utils/constants';
import '../CrudPage.css';

export default function AdminPage() {
  const { user } = useAuth();
  const toast = useApiToast();
  const [counts, setCounts] = useState({ employes: 0, stagiaires: 0, projets: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        employesAPI.getAll(),
        stagiairesAPI.getAll(),
        projetsAPI.getAll(),
      ]);
      setCounts({
        employes: results[0].status === 'fulfilled' ? (results[0].value.data || []).length : 0,
        stagiaires: results[1].status === 'fulfilled' ? (results[1].value.data || []).length : 0,
        projets: results[2].status === 'fulfilled' ? (results[2].value.data || []).length : 0,
      });
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="crud-loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admin Panel</h1>
          <p>System overview and administrative controls.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon="purple" label="Total Employees" value={counts.employes} />
        <StatCard icon="blue" label="Total Interns" value={counts.stagiaires} />
        <StatCard icon="green" label="Active Projects" value={counts.projets} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {/* System Info */}
        <div className="card">
          <h3 className="card-title">System Information</h3>
          <div className="detail-grid" style={{ marginTop: 16 }}>
            <div className="detail-field">
              <div className="detail-field-label">Logged In As</div>
              <div className="detail-field-value">{user?.nom} {user?.prenom}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">Email</div>
              <div className="detail-field-value">{user?.email}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">Role</div>
              <div className="detail-field-value">{user?.role}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">User ID</div>
              <div className="detail-field-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{user?.id}</div>
            </div>
          </div>
        </div>

        {/* Quick Admin Actions */}
        <div className="card">
          <h3 className="card-title">Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            <div style={{ padding: 12, background: 'var(--gray-50)', borderRadius: 'var(--border-radius)' }}>
              <strong style={{ fontSize: 'var(--text-sm)' }}>📊 Dashboard Overview</strong>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginTop: 4 }}>View comprehensive stats on the dashboard.</p>
            </div>
            <div style={{ padding: 12, background: 'var(--gray-50)', borderRadius: 'var(--border-radius)' }}>
              <strong style={{ fontSize: 'var(--text-sm)' }}>👥 Manage Employees</strong>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginTop: 4 }}>Add, edit, or remove employee records.</p>
            </div>
            <div style={{ padding: 12, background: 'var(--gray-50)', borderRadius: 'var(--border-radius)' }}>
              <strong style={{ fontSize: 'var(--text-sm)' }}>📄 Contract Management</strong>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginTop: 4 }}>Create and renew employee contracts.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
