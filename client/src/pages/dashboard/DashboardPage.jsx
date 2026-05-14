import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

const MONTH_LABELS = {
  fr: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

// Bucket absences into the last 6 months, summing hours per month.
function bucketAbsencesByMonth(absences) {
  const now = new Date();
  const buckets = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ year: d.getFullYear(), month: d.getMonth(), hours: 0, count: 0 });
  }
  for (const a of absences) {
    if (!a.date) continue;
    const d = new Date(a.date);
    const bucket = buckets.find((b) => b.year === d.getFullYear() && b.month === d.getMonth());
    if (bucket) {
      bucket.hours += Number(a.nombre_des_heures) || 0;
      bucket.count += 1;
    }
  }
  return buckets;
}

// Pick conges whose date_debut <= end-of-this-week AND date_debut + periode >= start-of-today
function pickOutThisWeek(conges) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return conges.filter((c) => {
    if (c.status !== 'approved') return false;
    if (!c.date_debut) return false;
    const start = new Date(c.date_debut);
    const days = Number(c.periode) || 1;
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    // Overlaps the next 7 days
    return start <= weekEnd && end >= today;
  });
}

export default function DashboardPage() {
  const { role } = useAuth();
  const { t, i18n } = useTranslation();
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
  const [allAbsences, setAllAbsences] = useState([]);
  const [allConges, setAllConges] = useState([]);
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

      const absencesData = absencesRes.status === 'fulfilled' ? (absencesRes.value.data || []) : [];
      const congesData = congesRes.status === 'fulfilled' ? (congesRes.value.data || []) : [];

      setStats({
        employes: employesRes.status === 'fulfilled' ? (employesRes.value.data || []).length : 0,
        stagiaires: stagiairesRes.status === 'fulfilled' ? (stagiairesRes.value.data || []).length : 0,
        projets: projetsRes.status === 'fulfilled' ? (projetsRes.value.data || []).length : 0,
        contrats: contratsRes.status === 'fulfilled' ? (contratsRes.value.data || []).length : 0,
        absences: absencesData.length,
        conges: congesData.length,
        demandes: demandesRes.status === 'fulfilled' ? (demandesRes.value.data || []).length : 0,
        demandesPending:
          demandesRes.status === 'fulfilled'
            ? (demandesRes.value.data || []).filter((d) => d.status === 'pending').length
            : 0,
      });

      if (demandesRes.status === 'fulfilled') {
        setRecentDemandes((demandesRes.value.data || []).slice(0, 5));
      }
      setAllAbsences(absencesData);
      setAllConges(congesData);
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  }

  const isAdminOrRH = role === ROLES.ADMIN || role === ROLES.RH;
  const lang = (i18n.resolvedLanguage || 'fr').slice(0, 2);
  const monthNames = MONTH_LABELS[lang] || MONTH_LABELS.fr;

  const absenceMonths = useMemo(() => bucketAbsencesByMonth(allAbsences), [allAbsences]);
  const outThisWeek = useMemo(() => pickOutThisWeek(allConges), [allConges]);
  const maxHours = useMemo(
    () => Math.max(1, ...absenceMonths.map((b) => b.hours)),
    [absenceMonths]
  );

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{t('dashboard.title')}</h1>
          <p>{t('dashboard.welcome')}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {isAdminOrRH && (
          <>
            <StatCard icon="purple" label={t('dashboard.stats.employes')} value={stats.employes} />
            <StatCard icon="blue" label={t('dashboard.stats.stagiaires')} value={stats.stagiaires} />
            <StatCard icon="green" label={t('dashboard.stats.projets')} value={stats.projets} />
            <StatCard icon="yellow" label={t('dashboard.stats.contrats')} value={stats.contrats} />
            <StatCard icon="red" label={t('dashboard.stats.absences')} value={stats.absences} />
            <StatCard icon="purple" label={t('dashboard.stats.conges')} value={stats.conges} />
          </>
        )}
        {(role === ROLES.EMPLOYE || role === ROLES.STAGIAIRE) && (
          <>
            <StatCard icon="green" label={t('dashboard.stats.projets')} value={stats.projets} />
            <StatCard icon="blue" label={t('dashboard.stats.conges')} value={stats.conges} />
            <StatCard icon="yellow" label={t('dashboard.stats.demandes')} value={stats.demandes} />
            <StatCard icon="red" label={t('dashboard.stats.demandesPending')} value={stats.demandesPending} />
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
                <h3 className="card-title">{t('dashboard.pendingRequests')}</h3>
                <Link to="/demandes" className="btn btn-ghost btn-sm" style={{background: 'rgba(255,255,255,0.5)', borderRadius: '10px'}}>
                  {t('dashboard.viewAll')}
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

          {/* Real absences-by-month bar chart, last 6 months */}
          {isAdminOrRH && (
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">{t('dashboard.absencesByMonth')}</h3>
                <Link to="/absences" className="btn btn-ghost btn-sm" style={{background: 'rgba(255,255,255,0.5)', borderRadius: '10px'}}>
                  {t('dashboard.viewAll')}
                </Link>
              </div>
              <div className="dash-bar-chart">
                {absenceMonths.map((b) => {
                  const heightPct = (b.hours / maxHours) * 100;
                  return (
                    <div key={`${b.year}-${b.month}`} className="dash-bar-col" title={`${b.hours}h • ${b.count} ${b.count === 1 ? 'absence' : 'absences'}`}>
                      <div className="dash-bar-value">{b.hours || ''}</div>
                      <div
                        className={`dash-bar ${b.hours === 0 ? 'is-empty' : ''}`}
                        style={{ height: `${heightPct}%` }}
                      />
                      <div className="dash-bar-label">{monthNames[b.month]}</div>
                    </div>
                  );
                })}
              </div>
              <div className="dash-card-footnote">
                {t('dashboard.absencesFootnote')}
              </div>
            </div>
          )}

          {/* Who's out this week (approved congés overlapping the next 7 days) */}
          {isAdminOrRH && (
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">{t('dashboard.outThisWeek')}</h3>
                <Link to="/conges" className="btn btn-ghost btn-sm" style={{background: 'rgba(255,255,255,0.5)', borderRadius: '10px'}}>
                  {t('dashboard.viewAll')}
                </Link>
              </div>
              {outThisWeek.length === 0 ? (
                <div className="dash-card-empty">
                  ✅ {t('dashboard.everyonePresent')}
                </div>
              ) : (
                <div className="dashboard-list">
                  {outThisWeek.slice(0, 6).map((c) => {
                    const emp = c.employe || {};
                    const start = new Date(c.date_debut);
                    const end = new Date(start);
                    end.setDate(end.getDate() + (Number(c.periode) || 1));
                    return (
                      <div key={c.id} className="dashboard-list-item">
                        <div>
                          <div className="dashboard-list-title">
                            {emp.prenom} {emp.nom}
                          </div>
                          <div className="dashboard-list-meta">
                            {formatDate(start)} → {formatDate(end)} ({c.periode}d)
                          </div>
                        </div>
                        <Badge variant="info">{formatLabel(c.type_conge)}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
