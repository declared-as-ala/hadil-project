import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import { useApiToast } from '../../components/common/Toast';
import { employesAPI } from '../../api/employes.api';
import { stagiairesAPI } from '../../api/stagiaires.api';
import { projetsAPI } from '../../api/projets.api';
import { contratsAPI } from '../../api/contrats.api';
import { absencesAPI } from '../../api/absences.api';
import { congesAPI } from '../../api/conges.api';
import { demandesAPI } from '../../api/demandes.api';
import Badge from '../../components/common/Badge';
import { formatDate, formatLabel } from '../../utils/formatters';
import './Dashboard.css';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';

export default function DashboardPage() {
  const { role } = useAuth();
  const toast = useApiToast();
  const [stats, setStats] = useState({
    employes: 0,
    stagiaires: 0,
    projets: 0,
    contrats: 0,
    absences: 0,
    conges: 0,
    demandes: 0,
    demandesPending: 0,
  });
  const [recentDemandes, setRecentDemandes] = useState([]);
  const [recentAbsences, setRecentAbsences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [
        employesRes,
        stagiairesRes,
        projetsRes,
        contratsRes,
        absencesRes,
        congesRes,
        demandesRes,
      ] = await Promise.allSettled([
        employesAPI.getAll(),
        stagiairesAPI.getAll(),
        projetsAPI.getAll(),
        contratsAPI.getAll(),
        absencesAPI.getAll(),
        congesAPI.getAll(),
        demandesAPI.getAll(),
      ]);

      setStats({
        employes: employesRes.status === 'fulfilled' ? (employesRes.value.data || []).length : 0,
        stagiaires: stagiairesRes.status === 'fulfilled' ? (stagiairesRes.value.data || []).length : 0,
        projets: projetsRes.status === 'fulfilled' ? (projetsRes.value.data || []).length : 0,
        contrats: contratsRes.status === 'fulfilled' ? (contratsRes.value.data || []).length : 0,
        absences: absencesRes.status === 'fulfilled' ? (absencesRes.value.data || []).length : 0,
        conges: congesRes.status === 'fulfilled' ? (congesRes.value.data || []).length : 0,
        demandes: demandesRes.status === 'fulfilled' ? (demandesRes.value.data || []).length : 0,
        demandesPending:
          demandesRes.status === 'fulfilled'
            ? (demandesRes.value.data || []).filter((d) => d.status === 'pending').length
            : 0,
      });

      if (demandesRes.status === 'fulfilled') {
        setRecentDemandes((demandesRes.value.data || []).slice(0, 5));
      }
      if (absencesRes.status === 'fulfilled') {
        setRecentAbsences((absencesRes.value.data || []).slice(0, 5));
      }
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  }

  const isAdminOrRH = role === ROLES.ADMIN || role === ROLES.RH;

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back! Here is an overview of your HR system.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {isAdminOrRH && (
          <>
            <StatCard icon="purple" label="Total Employees" value={stats.employes} />
            <StatCard icon="blue" label="Total Interns" value={stats.stagiaires} />
            <StatCard icon="green" label="Active Projects" value={stats.projets} />
            <StatCard icon="yellow" label="Active Contracts" value={stats.contrats} />
            <StatCard icon="red" label="Total Absences" value={stats.absences} />
            <StatCard icon="blue" label="Leave Requests" value={stats.conges} />
          </>
        )}
        {(role === ROLES.EMPLOYE || role === ROLES.STAGIAIRE) && (
          <>
            <StatCard icon="green" label="Active Projects" value={stats.projets} />
            <StatCard icon="blue" label="Leave Requests" value={stats.conges} />
            <StatCard icon="yellow" label="Requests & Claims" value={stats.demandes} />
            <StatCard icon="red" label="Pending Requests" value={stats.demandesPending} />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="dashboard-sections">
        <div className="dashboard-grid">
          {/* Pending Demandes */}
          {isAdminOrRH && recentDemandes.length > 0 && (
            <div className="card dashboard-card">
              <div className="card-header">
                <h3 className="card-title">Pending Requests</h3>
                <Link to="/demandes" className="btn btn-ghost btn-sm">
                  View All
                </Link>
              </div>
              <div className="dashboard-list">
                {recentDemandes
                  .filter((d) => d.status === 'pending')
                  .slice(0, 5)
                  .map((d) => (
                    <div key={d.id} className="dashboard-list-item">
                      <div>
                        <div className="dashboard-list-title">{d.sujet}</div>
                        <div className="dashboard-list-meta">{formatDate(d.createdAt)}</div>
                      </div>
                      <Badge variant="warning">{formatLabel(d.status)}</Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Recent Absences */}
          {isAdminOrRH && recentAbsences.length > 0 && (
            <div className="card dashboard-card">
              <div className="card-header">
                <h3 className="card-title">Recent Absences</h3>
                <Link to="/absences" className="btn btn-ghost btn-sm">
                  View All
                </Link>
              </div>
              <div className="dashboard-list">
                {recentAbsences.slice(0, 5).map((a) => (
                  <div key={a.id} className="dashboard-list-item">
                    <div>
                      <div className="dashboard-list-title">{a.raison || 'Absence recorded'}</div>
                      <div className="dashboard-list-meta">
                        {formatDate(a.date)} &middot; {a.nombre_des_heures}h
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="card dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
            </div>
            <div className="quick-actions">
              {isAdminOrRH && (
                <>
                  <Link to="/employes" className="quick-action-btn">
                    <span className="quick-action-icon">\uD83D\uDC65</span>
                    <span>Employees</span>
                  </Link>
                  <Link to="/stagiaires" className="quick-action-btn">
                    <span className="quick-action-icon">\uD83C\uDF93</span>
                    <span>Interns</span>
                  </Link>
                  <Link to="/contrats" className="quick-action-btn">
                    <span className="quick-action-icon">\uD83D\uDCC4</span>
                    <span>Contracts</span>
                  </Link>
                  <Link to="/conges" className="quick-action-btn">
                    <span className="quick-action-icon">\uD83C\uDFD6\uFE0F</span>
                    <span>Leaves</span>
                  </Link>
                  <Link to="/projets" className="quick-action-btn">
                    <span className="quick-action-icon">\uD83D\uDE80</span>
                    <span>Projects</span>
                  </Link>
                  <Link to="/messages" className="quick-action-btn">
                    <span className="quick-action-icon">\uD83D\uDCAC</span>
                    <span>Messages</span>
                  </Link>
                </>
              )}
              {role === ROLES.EMPLOYE && (
                <>
                  <Link to="/demandes" className="quick-action-btn">
                    <span className="quick-action-icon">\uD83D\uDCE9</span>
                    <span>New Request</span>
                  </Link>
                  <Link to="/conges" className="quick-action-btn">
                    <span className="quick-action-icon">\uD83C\uDFD6\uFE0F</span>
                    <span>Request Leave</span>
                  </Link>
                  <Link to="/messages" className="quick-action-btn">
                    <span className="quick-action-icon">\uD83D\uDCAC</span>
                    <span>Messages</span>
                  </Link>
                  <Link to="/projets" className="quick-action-btn">
                    <span className="quick-action-icon">\uD83D\uDE80</span>
                    <span>My Projects</span>
                  </Link>
                </>
              )}
              {role === ROLES.STAGIAIRE && (
                <>
                  <Link to="/demandes" className="quick-action-btn">
                    <span className="quick-action-icon">\uD83D\uDCE9</span>
                    <span>My Requests</span>
                  </Link>
                  <Link to="/messages" className="quick-action-btn">
                    <span className="quick-action-icon">\uD83D\uDCAC</span>
                    <span>Messages</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
