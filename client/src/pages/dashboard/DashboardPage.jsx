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

// Pseudo-random smooth SVG path generator for the area chart
const generateChartPath = () => {
  return "M0,60 C20,20 40,80 60,40 C80,0 100,70 120,30 C140,-10 160,50 180,20 C200,-10 220,60 240,10 C260,-40 280,30 300,0";
};

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
      const isAdminOrRH = role === ROLES.ADMIN || role === ROLES.RH;
      const isEmploye = role === ROLES.EMPLOYE;
      const isStagiaire = role === ROLES.STAGIAIRE;

      const [
        employesRes,
        stagiairesRes,
        projetsRes,
        contratsRes,
        absencesRes,
        congesRes,
        demandesRes,
      ] = await Promise.allSettled([
        isAdminOrRH ? employesAPI.getAll() : Promise.resolve({ data: [] }),
        isAdminOrRH ? stagiairesAPI.getAll() : Promise.resolve({ data: [] }),
        (isAdminOrRH || isEmploye) ? projetsAPI.getAll() : Promise.resolve({ data: [] }),
        isAdminOrRH ? contratsAPI.getAll() : Promise.resolve({ data: [] }),
        (isAdminOrRH || isEmploye) ? absencesAPI.getAll() : Promise.resolve({ data: [] }),
        (isAdminOrRH || isEmploye) ? congesAPI.getAll() : Promise.resolve({ data: [] }),
        (isAdminOrRH || isEmploye || isStagiaire) ? demandesAPI.getAll() : Promise.resolve({ data: [] }),
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
  const pathData = generateChartPath();

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Loading your workspace...</p>
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
            <StatCard icon="purple" label="Leave Requests" value={stats.conges} />
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

      {/* Sections */}
      <div className="dashboard-sections">
        <div className="dashboard-grid">
          {/* Pending Demandes */}
          {isAdminOrRH && recentDemandes.length > 0 && (
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">Pending Requests</h3>
                <Link to="/demandes" className="btn btn-ghost btn-sm" style={{background: 'rgba(255,255,255,0.5)', borderRadius: '10px'}}>
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

          {/* Recent Absences + Area Chart */}
          {isAdminOrRH && (
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">Absence Trends</h3>
                <Link to="/absences" className="btn btn-ghost btn-sm" style={{background: 'rgba(255,255,255,0.5)', borderRadius: '10px'}}>
                  View All
                </Link>
              </div>
              
              <div className="mini-chart">
                <svg viewBox="0 -10 300 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradientFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="chartGradientStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <path d={`${pathData} L300,100 L0,100 Z`} className="chart-area" />
                  <path d={pathData} className="chart-line" />
                </svg>
              </div>

              {recentAbsences.length > 0 && (
                <div className="dashboard-list">
                  {recentAbsences.slice(0, 3).map((a) => (
                    <div key={a.id} className="dashboard-list-item" style={{padding: '12px 24px'}}>
                      <div>
                        <div className="dashboard-list-title">{a.raison || 'Absence recorded'}</div>
                        <div className="dashboard-list-meta">
                          {formatDate(a.date)} &middot; {a.nombre_des_heures}h
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
