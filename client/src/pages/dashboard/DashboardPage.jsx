import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import { useApiToast } from '../../components/common/Toast';
import { employesAPI } from '../../api/employes.api';
import { absencesAPI } from '../../api/absences.api';
import { congesAPI } from '../../api/conges.api';
import { documentsAdminAPI } from '../../api/documentsAdmin.api';
import { heuresSupAPI } from '../../api/heuresSup.api';
import { paieAPI } from '../../api/paie.api';
import Badge from '../../components/common/Badge';
import { formatDate, formatLabel } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import './Dashboard.css';

const WEEK_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function formatMoney(value) {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value) || 0)} DT`;
}

function getOvertimeHours(entry) {
  return Number(entry?.heureSupplementaire ?? entry?.heures) || 0;
}

function getEmployeeName(employe) {
  if (!employe) return 'Employé';
  return `${employe.prenom || ''} ${employe.nom || ''}`.trim() || 'Employé';
}

function getStartOfCurrentWeek() {
  const now = new Date();
  const day = now.getDay() || 7;
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - day + 1);
  return startOfWeek;
}

function getEntityId(entity) {
  return entity?.id || entity?._id || (typeof entity === 'string' ? entity : '');
}

function getCongeEndDate(conge) {
  const end = new Date(conge.date_debut);
  end.setHours(23, 59, 59, 999);
  end.setDate(end.getDate() + Math.max(Number(conge.periode) || 1, 1) - 1);
  return end;
}

function isCongeActiveToday(conge) {
  if (!conge?.date_debut || conge.status !== 'approved') return false;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);

  const start = new Date(conge.date_debut);
  start.setHours(0, 0, 0, 0);

  return start <= todayEnd && getCongeEndDate(conge) >= todayStart;
}

function getCongeEmployeId(conge) {
  return getEntityId(conge?.employe);
}



export default function DashboardPage() {
  const { role, user } = useAuth();
  const toast = useApiToast();

  // Filters State
  const [period, setPeriod] = useState('week'); // 'week' | 'month'

  // Data States
  const [allAbsences, setAllAbsences] = useState([]);
  const [allHeuresSup, setAllHeuresSup] = useState([]);
  const [allConges, setAllConges] = useState([]);
  const [allDocs, setAllDocs] = useState([]);
  const [allEmployes, setAllEmployes] = useState([]);
  const [allPaies, setAllPaies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const isAdminOrRH = role === ROLES.ADMIN || role === ROLES.RH;
      const isEmploye = role === ROLES.EMPLOYE;

      const [
        employesRes,
        absencesRes,
        congesRes,
        docsRes,
        heuresSupRes,
        paiesRes,
      ] = await Promise.allSettled([
        isAdminOrRH ? employesAPI.getAll() : Promise.resolve({ data: [] }),
        isAdminOrRH || isEmploye ? absencesAPI.getAll() : Promise.resolve({ data: [] }),
        isAdminOrRH ? congesAPI.getAll() : isEmploye ? congesAPI.getMy() : Promise.resolve({ data: [] }),
        isAdminOrRH ? documentsAdminAPI.getAll() : documentsAdminAPI.getMesDemandes(),
        isAdminOrRH || isEmploye ? heuresSupAPI.getAll() : Promise.resolve({ data: [] }),
        isAdminOrRH ? paieAPI.getAll() : paieAPI.getMesPaies(),
      ]);

      setAllEmployes(employesRes.status === 'fulfilled' ? employesRes.value.data || [] : []);
      setAllAbsences(absencesRes.status === 'fulfilled' ? absencesRes.value.data || [] : []);
      setAllConges(congesRes.status === 'fulfilled' ? congesRes.value.data || [] : []);
      setAllDocs(docsRes.status === 'fulfilled' ? docsRes.value.data || [] : []);
      setAllHeuresSup(heuresSupRes.status === 'fulfilled' ? heuresSupRes.value.data || [] : []);
      setAllPaies(paiesRes.status === 'fulfilled' ? paiesRes.value.data || [] : []);
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  }

  const isAdminOrRH = role === ROLES.ADMIN || role === ROLES.RH;

  // 1. Filter employee IDs
  const filteredEmployeeIds = useMemo(() => {
    return new Set(allEmployes.map((emp) => emp.id));
  }, [allEmployes]);

  const filteredAbsences = allAbsences;
  const filteredHeuresSup = allHeuresSup;
  const filteredConges = allConges;
  const filteredDocs = allDocs;
  const filteredPaies = allPaies;

  // 4. Helper to determine if a date falls in selected Period filter
  const isDateInPeriod = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const now = new Date();

    if (period === 'week') {
      const day = now.getDay() || 7;
      const startOfWeek = new Date(now);
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(now.getDate() - day + 1);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return d >= startOfWeek && d <= endOfWeek;
    }

    if (period === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }

    if (period === 'year') {
      return d.getFullYear() === now.getFullYear();
    }

    return false;
  };

  // 5. Calculate KPI stats based on active period & filters
  const calculatedStats = useMemo(() => {
    const employesCount = isAdminOrRH ? filteredEmployeeIds.size : allEmployes.length;

    // Absences
    const periodAbsences = filteredAbsences.filter((abs) => isDateInPeriod(abs.date || abs.createdAt));
    const absencesHours = periodAbsences.reduce((sum, abs) => sum + (Number(abs.nombre_des_heures) || 0), 0);

    // Overtime
    const periodHeuresSup = filteredHeuresSup.filter((hs) => isDateInPeriod(hs.date || hs.createdAt));
    const overtimeHours = periodHeuresSup.reduce((sum, hs) => sum + getOvertimeHours(hs), 0);

    // Salaries
    const periodPaies = filteredPaies.filter((paie) => {
      if (!paie.mois || !paie.annee) return false;
      const now = new Date();
      if (period === 'week' || period === 'month') {
        return Number(paie.mois) === (now.getMonth() + 1) && Number(paie.annee) === now.getFullYear();
      }
      if (period === 'year') {
        return Number(paie.annee) === now.getFullYear();
      }
      return false;
    });
    const totalSalaries = periodPaies.reduce((sum, p) => sum + (Number(p.salaire_total) || Number(p.salaire_base) || 0), 0);

    // Documents
    const periodDocs = filteredDocs.filter((doc) => isDateInPeriod(doc.createdAt));

    // Pending Requests
    const pendingCongesCount = filteredConges.filter((c) => c.status === 'pending').length;
    const pendingDocsCount = filteredDocs.filter((d) => d.status === 'en_attente').length;

    return {
      employes: employesCount,
      absencesCount: periodAbsences.length,
      absencesHours,
      overtimeHours,
      salaires: totalSalaries,
      docsCount: periodDocs.length,
      pendingConges: pendingCongesCount,
      pendingDocs: pendingDocsCount,
      totalPending: pendingCongesCount + pendingDocsCount,
    };
  }, [
    period,
    isAdminOrRH,
    filteredEmployeeIds,
    allEmployes,
    filteredAbsences,
    filteredHeuresSup,
    filteredPaies,
    filteredDocs,
    filteredConges,
  ]);

  // 6. Calculate Chart buckets based on period
  const chartData = useMemo(() => {
    const now = new Date();

    if (period === 'week') {
      const startOfWeek = getStartOfCurrentWeek();
      const buckets = WEEK_LABELS.map((label, index) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + index);
        return { label, dateKey: date.toDateString(), absences: 0, overtime: 0 };
      });

      for (const absence of filteredAbsences) {
        if (!absence.date) continue;
        const d = new Date(absence.date);
        const bucket = buckets.find((b) => b.dateKey === d.toDateString());
        if (bucket) {
          bucket.absences += Number(absence.nombre_des_heures) || 0;
        }
      }

      for (const hs of filteredHeuresSup) {
        if (!hs.date) continue;
        const d = new Date(hs.date);
        const bucket = buckets.find((b) => b.dateKey === d.toDateString());
        if (bucket) {
          bucket.overtime += getOvertimeHours(hs);
        }
      }

      return buckets;
    }

    if (period === 'month') {
      const buckets = [
        { label: 'Sem 1 (1-7)', start: 1, end: 7, absences: 0, overtime: 0 },
        { label: 'Sem 2 (8-14)', start: 8, end: 14, absences: 0, overtime: 0 },
        { label: 'Sem 3 (15-21)', start: 15, end: 21, absences: 0, overtime: 0 },
        { label: 'Sem 4 (22+)', start: 22, end: 31, absences: 0, overtime: 0 },
      ];

      for (const absence of filteredAbsences) {
        const dateVal = absence.date || absence.createdAt;
        if (!dateVal) continue;
        const d = new Date(dateVal);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
          const day = d.getDate();
          const bucket = buckets.find((b) => day >= b.start && day <= b.end);
          if (bucket) bucket.absences += Number(absence.nombre_des_heures) || 0;
        }
      }

      for (const hs of filteredHeuresSup) {
        const dateVal = hs.date || hs.createdAt;
        if (!dateVal) continue;
        const d = new Date(dateVal);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
          const day = d.getDate();
          const bucket = buckets.find((b) => day >= b.start && day <= b.end);
          if (bucket) bucket.overtime += getOvertimeHours(hs);
        }
      }

      return buckets;
    }

    if (period === 'year') {
      const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      const buckets = MONTH_LABELS.map((label, index) => ({
        label,
        monthIndex: index,
        absences: 0,
        overtime: 0,
      }));

      for (const absence of filteredAbsences) {
        const dateVal = absence.date || absence.createdAt;
        if (!dateVal) continue;
        const d = new Date(dateVal);
        if (d.getFullYear() === now.getFullYear()) {
          const bucket = buckets.find((b) => b.monthIndex === d.getMonth());
          if (bucket) bucket.absences += Number(absence.nombre_des_heures) || 0;
        }
      }

      for (const hs of filteredHeuresSup) {
        const dateVal = hs.date || hs.createdAt;
        if (!dateVal) continue;
        const d = new Date(dateVal);
        if (d.getFullYear() === now.getFullYear()) {
          const bucket = buckets.find((b) => b.monthIndex === d.getMonth());
          if (bucket) bucket.overtime += getOvertimeHours(hs);
        }
      }

      return buckets;
    }

    return [];
  }, [period, filteredAbsences, filteredHeuresSup]);

  const maxChartValue = useMemo(() => {
    return Math.max(1, ...chartData.flatMap((b) => [b.absences, b.overtime]));
  }, [chartData]);

  // 7. Calculate Employees status count (Donut representation)
  const employeeSnapshot = useMemo(() => {
    const currentLeaveEmployeeIds = new Set(
      allConges
        .filter(isCongeActiveToday)
        .map(getCongeEmployeId)
        .filter(Boolean)
    );

    const total = allEmployes.length;
    const inactifs = allEmployes.filter((emp) => emp.status === 'inactif' || emp.status === 'inactiff').length;
    const enConge = allEmployes.filter((emp) => {
      return emp.status !== 'inactif' && emp.status !== 'inactiff' && currentLeaveEmployeeIds.has(getEntityId(emp));
    }).length;
    const actifs = allEmployes.filter((emp) => {
      return emp.status !== 'inactif' && emp.status !== 'inactiff' && !currentLeaveEmployeeIds.has(getEntityId(emp));
    }).length;

    const pctActif = total > 0 ? Math.round((actifs / total) * 100) : 0;
    const pctConge = total > 0 ? Math.round((enConge / total) * 100) : 0;
    const pctInactif = total > 0 ? Math.round((inactifs / total) * 100) : 0;

    return { total, actifs, enConge, inactifs, pctActif, pctConge, pctInactif };
  }, [allConges, allEmployes]);



  // 8. Dynamic list of pending requests
  const pendingDemandesList = useMemo(() => {
    const conges = filteredConges
      .filter((c) => c.status === 'pending')
      .map((c) => ({
        id: `conge-${c.id}`,
        title: `Congé: ${getEmployeeName(c.employe)}`,
        meta: `Du ${new Date(c.date_debut).toLocaleDateString('fr-FR')} (${c.periode}j)`,
        status: 'pending',
        date: c.createdAt,
        type: 'Congé',
        link: '/conges',
      }));

    const docs = filteredDocs
      .filter((d) => d.status === 'en_attente')
      .map((d) => ({
        id: `doc-${d.id}`,
        title: `Doc: ${getEmployeeName(d.employe)}`,
        meta: `Type: ${(d.typeDocument || '').replace(/_/g, ' ')}`,
        status: 'en_attente',
        date: d.createdAt,
        type: 'Document',
        link: '/documents-admin',
      }));

    return [...conges, ...docs].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredConges, filteredDocs]);

  // 9. Timeline of recent system activities
  const recentActivitiesList = useMemo(() => {
    const absences = filteredAbsences.slice(0, 4).map((abs) => ({
      id: `absence-${abs.id}`,
      title: 'Absence enregistrée',
      meta: `${getEmployeeName(abs.employe)} - ${Number(abs.nombre_des_heures) || 0}h`,
      date: abs.createdAt || abs.date,
      variant: 'danger',
      symbol: '📅',
    }));

    const overtime = filteredHeuresSup.slice(0, 4).map((hs) => ({
      id: `overtime-${hs.id}`,
      title: 'Heures supplémentaires',
      meta: `${getEmployeeName(hs.employe)} - ${getOvertimeHours(hs)}h`,
      date: hs.createdAt || hs.date,
      variant: 'info',
      symbol: '⏳',
    }));

    const documents = filteredDocs.slice(0, 4).map((doc) => ({
      id: `doc-${doc.id}`,
      title: 'Demande document',
      meta: `${getEmployeeName(doc.employe)} - ${(doc.typeDocument || '').replace(/_/g, ' ')}`,
      date: doc.createdAt,
      variant: doc.status === 'en_attente' ? 'warning' : 'success',
      symbol: '📄',
    }));

    return [...absences, ...overtime, ...documents]
      .filter((act) => act.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);
  }, [filteredAbsences, filteredHeuresSup, filteredDocs]);

  // 10. Salary aggregate by Post (For Masse Salariale component)
  const salaryByPost = useMemo(() => {
    const map = {};
    allEmployes.forEach((emp) => {
      if (emp.status === 'inactif') return;
      const post = emp.poste || 'Non spécifié';
      const baseSalary = Number(emp.salaire_base) || 0;
      if (!map[post]) map[post] = 0;
      map[post] += baseSalary;
    });

    const list = Object.entries(map).map(([post, amount]) => ({ post, amount }));
    list.sort((a, b) => b.amount - a.amount);
    return list;
  }, [allEmployes]);

  const maxSalaryAmount = useMemo(() => {
    return Math.max(1, ...salaryByPost.map((s) => s.amount));
  }, [salaryByPost]);



  // 12. Employee Role Personalized statistics
  const employeeStats = useMemo(() => {
    if (role !== ROLES.EMPLOYE) return null;

    const totalConges = allConges.length;
    const approvedConges = allConges
      .filter((c) => c.status === 'approved')
      .reduce((sum, c) => sum + (Number(c.periode) || 0), 0);

    const totalOvertime = allHeuresSup.reduce((sum, hs) => sum + getOvertimeHours(hs), 0);

    const pendingCongesCount = allConges.filter((c) => c.status === 'pending').length;
    const pendingDocsCount = allDocs.filter((d) => d.status === 'en_attente').length;
    const totalPending = pendingCongesCount + pendingDocsCount;

    const lastSalary = allPaies.length > 0
      ? [...allPaies].sort((a, b) => {
          if (Number(b.annee) !== Number(a.annee)) return Number(b.annee) - Number(a.annee);
          return Number(b.mois) - Number(a.mois);
        })[0]?.salaire_total
      : 0;

    return {
      totalConges,
      approvedConges,
      totalOvertime,
      totalPending,
      lastSalary,
    };
  }, [role, allConges, allHeuresSup, allDocs, allPaies]);

  // SVG Donut Calculations
  const radius = 30;
  const circ = 2 * Math.PI * radius; // ~188.5
  const strokeActif = (employeeSnapshot.pctActif / 100) * circ;
  const strokeConge = (employeeSnapshot.pctConge / 100) * circ;
  const strokeInactif = (employeeSnapshot.pctInactif / 100) * circ;
  const offsetActif = 0;
  const offsetConge = -strokeActif;
  const offsetInactif = -(strokeActif + strokeConge);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Chargement des indicateurs...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Top Header Row with Title and Period Filter */}
      <div className="dashboard-header-row">
        <div>
          <h1 className="dashboard-title-main">Tableau de bord</h1>
          <p className="dashboard-subtitle-main">Analyse et suivi en temps réel de votre système RH.</p>
        </div>
        {isAdminOrRH && (
          <div className="top-period-filter">
            <span className="filter-label">Période :</span>
            <div className="filter-period-buttons">
              <button
                type="button"
                className={period === 'week' ? 'active' : ''}
                onClick={() => setPeriod('week')}
              >
                Semaine
              </button>
              <button
                type="button"
                className={period === 'month' ? 'active' : ''}
                onClick={() => setPeriod('month')}
              >
                Mois
              </button>
            </div>
          </div>
        )}
      </div>

      {/* KPI Stat Cards Row (Single Line) */}
      <div className="stats-grid dashboard-stats-grid">
        {isAdminOrRH ? (
          <>
            <StatCard
              icon="purple"
              symbol="👥"
              label="Effectif Global"
              value={calculatedStats.employes}
            />
            <StatCard
              icon="red"
              symbol="📅"
              label={`Absences / ${period === 'week' ? 'sem' : 'mois'}`}
              value={`${calculatedStats.absencesCount} (${calculatedStats.absencesHours}h)`}
            />
            <StatCard
              icon="blue"
              symbol="⏳"
              label={`Heures Sup. / ${period === 'week' ? 'sem' : 'mois'}`}
              value={`${calculatedStats.overtimeHours}h`}
            />
            <StatCard
              icon="green"
              symbol="💰"
              label="Masse Salariale / mois"
              value={formatMoney(calculatedStats.salaires)}
            />
            <StatCard
              icon="orange"
              symbol="📄"
              label={`Docs Demandés / ${period === 'week' ? 'sem' : 'mois'}`}
              value={calculatedStats.docsCount}
            />
            <StatCard
              icon="yellow"
              symbol="🔔"
              label="Demandes en Attente"
              value={calculatedStats.totalPending}
            />
          </>
        ) : (
          <>
            <StatCard
              icon="purple"
              symbol="🌴"
              label="Jours de congés pris"
              value={`${employeeStats?.approvedConges || 0}j`}
            />
            <StatCard
              icon="yellow"
              symbol="⏳"
              label="Demandes en attente"
              value={employeeStats?.totalPending || 0}
            />
            <StatCard
              icon="blue"
              symbol="⏰"
              label="Heures sup cumulées"
              value={`${employeeStats?.totalOvertime || 0}h`}
            />
            <StatCard
              icon="green"
              symbol="💵"
              label="Dernier salaire perçu"
              value={formatMoney(employeeStats?.lastSalary)}
            />
          </>
        )}
      </div>

      {/* Admin Main Grid Dashboard (Charts & Progress) */}
      {isAdminOrRH ? (
        <>
          <div className="dashboard-main-grid">
            {/* Visual Chart Card */}
            <div className="dashboard-card dashboard-chart-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Suivi des absences & heures sup</h3>
                  <p className="card-subtitle">
                    Analyse comparative .
                  </p>
                </div>
                <div className="chart-header-actions">
                  <div className="chart-legend">
                    <span className="legend-dot legend-dot-red" /> Absences
                    <span className="legend-dot legend-dot-blue" style={{ marginLeft: 10 }} /> Heures sup.
                  </div>
                </div>
              </div>

              <div className="dash-comparison-chart-container">
                <div className="dash-comparison-chart">
                  {chartData.map((bucket) => {
                    const absenceHeight = (bucket.absences / maxChartValue) * 100;
                    const overtimeHeight = (bucket.overtime / maxChartValue) * 100;

                    return (
                      <div key={bucket.label} className="dash-comparison-day">
                        <div className="dash-comparison-bars">
                          <div
                            className={`dash-bar dash-bar-red ${bucket.absences === 0 ? 'is-empty' : ''}`}
                            title={`Absences: ${bucket.absences}h`}
                            style={{ height: `${absenceHeight}%` }}
                          />
                          <div
                            className={`dash-bar dash-bar-blue ${bucket.overtime === 0 ? 'is-empty' : ''}`}
                            title={`Heures sup: ${bucket.overtime}h`}
                            style={{ height: `${overtimeHeight}%` }}
                          />
                        </div>
                        <div className="dash-bar-label">{bucket.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="dash-card-footnote dashboard-chart-links">
                <span>
                  Période active : <strong>{period === 'week' ? 'Semaine en cours' : 'Mois en cours'}</strong>
                </span>
                <span>
                  <Link to="/absences">Consigner Absence</Link>
                  <Link to="/heures-sup">Heures Sup.</Link>
                </span>
              </div>
            </div>

            {/* Pending Requests Table (ABS SARL/MyDoc style) */}
            <div className="dashboard-card pending-requests-card">
              <div className="card-header">
                <h3 className="card-title">Demandes en attente ({pendingDemandesList.length})</h3>
                <Link to="/conges" className="btn btn-ghost btn-sm dashboard-card-link">
                  Traiter
                </Link>
              </div>
              {pendingDemandesList.length === 0 ? (
                <div className="dash-card-empty">Aucune demande en attente.</div>
              ) : (
                <div className="dashboard-list">
                  {pendingDemandesList.slice(0, 5).map((demande) => (
                    <div key={demande.id} className="dashboard-list-item">
                      <div className="dashboard-list-item-content">
                        <div className="dashboard-list-title">
                          <Link to={demande.link} className="dashboard-inline-link">
                            {demande.title}
                          </Link>
                        </div>
                        <div className="dashboard-list-meta">
                          {demande.meta} - {formatDate(demande.date)}
                        </div>
                      </div>
                      <Badge variant={demande.type === 'Congé' ? 'warning' : 'primary'}>
                        {demande.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row : Masse Salariale & Pending Demandes & Activities */}
          <div className="dashboard-bottom-grid">
            {/* Masse Salariale by Post Card (ABS SARL style) */}
            <div className="dashboard-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Masse Salariale par Poste</h3>
                  <p className="card-subtitle">Budget mensuel total de base cumulé.</p>
                </div>
              </div>

              <div className="salary-post-list">
                {salaryByPost.length === 0 ? (
                  <div className="dash-card-empty dash-card-empty-small">Aucune donnée salariale.</div>
                ) : (
                  salaryByPost.slice(0, 5).map((item) => {
                    const percentage = (item.amount / maxSalaryAmount) * 100;
                    return (
                      <div key={item.post} className="salary-post-row">
                        <div className="salary-post-info">
                          <span className="salary-post-name">{item.post}</span>
                          <span className="salary-post-val">{formatMoney(item.amount)}</span>
                        </div>
                        <div className="salary-post-bar-bg">
                          <div
                            className="salary-post-bar"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Team Distribution Circle (MyDoc/ABS SARL style) */}
            <div className="dashboard-card team-donut-card">
              <div className="card-header">
                <h3 className="card-title">Statut des employés</h3>
              </div>

              <div className="donut-content-wrapper">
                <div className="donut-visualization">
                  <svg width="150" height="150" viewBox="0 0 100 100" className="donut-chart-svg">
                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="10" />

                    {employeeSnapshot.pctActif > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke="var(--color-success)"
                        strokeWidth="10"
                        strokeDasharray={`${strokeActif} ${circ}`}
                        strokeDashoffset={offsetActif}
                        transform="rotate(-90 50 50)"
                        strokeLinecap="round"
                        className="donut-segment"
                      />
                    )}
                    {employeeSnapshot.pctConge > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke="var(--color-warning)"
                        strokeWidth="10"
                        strokeDasharray={`${strokeConge} ${circ}`}
                        strokeDashoffset={offsetConge}
                        transform="rotate(-90 50 50)"
                        strokeLinecap="round"
                        className="donut-segment"
                      />
                    )}
                    {employeeSnapshot.pctInactif > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke="var(--gray-400)"
                        strokeWidth="10"
                        strokeDasharray={`${strokeInactif} ${circ}`}
                        strokeDashoffset={offsetInactif}
                        transform="rotate(-90 50 50)"
                        strokeLinecap="round"
                        className="donut-segment"
                      />
                    )}

                    <text x="50" y="47" textAnchor="middle" dy="0.3em" className="donut-center-value">
                      {employeeSnapshot.total}
                    </text>
                    <text x="50" y="62" textAnchor="middle" dy="0.3em" className="donut-center-label">
                      Employés
                    </text>
                  </svg>
                </div>

                <div className="donut-legend-list">
                  <div className="donut-legend-item">
                    <span className="dot dot-success" />
                    <span className="label">Actifs</span>
                    <strong className="value">{employeeSnapshot.actifs} ({employeeSnapshot.pctActif}%)</strong>
                  </div>
                  <div className="donut-legend-item">
                    <span className="dot dot-warning" />
                    <span className="label">En congé</span>
                    <strong className="value">{employeeSnapshot.enConge} ({employeeSnapshot.pctConge}%)</strong>
                  </div>
                  <div className="donut-legend-item">
                    <span className="dot dot-gray" />
                    <span className="label">Inactifs</span>
                    <strong className="value">{employeeSnapshot.inactifs} ({employeeSnapshot.pctInactif}%)</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent activities list */}
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">Journal d'activité récent</h3>
              </div>
              {recentActivitiesList.length === 0 ? (
                <div className="dash-card-empty">Aucune activité récente.</div>
              ) : (
                <div className="dashboard-list dashboard-timeline-list">
                  {recentActivitiesList.map((act) => (
                    <div key={act.id} className="dashboard-timeline-item">
                      <div className="timeline-badge" style={{ fontSize: '1rem' }}>
                        {act.symbol}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-title">{act.title}</div>
                        <div className="timeline-meta">
                          {act.meta} - {formatDate(act.date)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Employee Responsive Screen */
        <div className="dashboard-employee-layout">
          <div className="employee-layout-main">
            {/* Employee Quick Actions */}
            <div className="dashboard-card quick-actions-card">
              <div className="card-header" style={{ border: 'none', marginBottom: 12 }}>
                <h3 className="card-title">Raccourcis rapides</h3>
              </div>
              <div className="quick-actions-grid">
                <Link to="/conges" className="quick-action-btn">
                  <span className="action-icon">🌴</span>
                  <div className="action-texts">
                    <span className="action-title">Demander un congé</span>
                    <span className="action-desc">Faire une demande de vacances</span>
                  </div>
                </Link>
                <Link to="/documents-admin" className="quick-action-btn">
                  <span className="action-icon">📄</span>
                  <div className="action-texts">
                    <span className="action-title">Demander Document</span>
                    <span className="action-desc">Attestation de travail, etc.</span>
                  </div>
                </Link>
                <Link to="/heures-sup" className="quick-action-btn">
                  <span className="action-icon">⏰</span>
                  <div className="action-texts">
                    <span className="action-title">Déclarer Heures Sup</span>
                    <span className="action-desc">Saisir de nouvelles heures</span>
                  </div>
                </Link>
                <Link to="/messages" className="quick-action-btn">
                  <span className="action-icon">💬</span>
                  <div className="action-texts">
                    <span className="action-title">Messagerie interne</span>
                    <span className="action-desc">Discuter avec les RH</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* My Requests (MyDoc Patient File Style) */}
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">Suivi de mes demandes récentes</h3>
                <Link to="/conges" className="btn btn-ghost btn-sm dashboard-card-link">
                  Tout voir
                </Link>
              </div>
              {allConges.length === 0 && allDocs.length === 0 ? (
                <div className="dash-card-empty">Vous n'avez soumis aucune demande.</div>
              ) : (
                <div className="dashboard-table-tab-container">
                  <table className="compact-dashboard-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Détails / Objet</th>
                        <th>Date de soumission</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allConges.slice(0, 3).map((c) => (
                        <tr key={`emp-conge-${c.id}`}>
                          <td>
                            <strong className="txt-warning">🌴 Congé</strong>
                          </td>
                          <td>Du {formatDate(c.date_debut)} ({c.periode}j)</td>
                          <td>{formatDate(c.createdAt)}</td>
                          <td>
                            <Badge variant={c.status === 'approved' ? 'success' : c.status === 'rejected' ? 'danger' : 'warning'}>
                              {c.status === 'approved' ? 'Approuvé' : c.status === 'rejected' ? 'Refusé' : 'En attente'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {allDocs.slice(0, 3).map((d) => (
                        <tr key={`emp-doc-${d.id}`}>
                          <td>
                            <strong className="txt-primary">📄 Document</strong>
                          </td>
                          <td>{(d.typeDocument || '').replace(/_/g, ' ')}</td>
                          <td>{formatDate(d.createdAt)}</td>
                          <td>
                            <Badge variant={d.status === 'approuve' || d.status === 'valide' ? 'success' : d.status === 'rejete' ? 'danger' : 'warning'}>
                              {d.status === 'approuve' || d.status === 'valide' ? 'Validé' : d.status === 'rejete' ? 'Rejeté' : 'En attente'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="employee-layout-side">
            {/* Leave balances (Visual gauge) */}
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">Mes congés</h3>
              </div>
              <div className="leave-balance-gauge-container">
                <div className="leave-gauge-item">
                  <div className="leave-gauge-info">
                    <span>Congés consommés</span>
                    <strong>{employeeStats?.approvedConges || 0} jours</strong>
                  </div>
                  <div className="leave-gauge-bar-bg">
                    <div
                      className="leave-gauge-bar"
                      style={{
                        width: `${Math.min(100, ((employeeStats?.approvedConges || 0) / 30) * 100)}%`,
                        background: 'var(--color-primary)',
                      }}
                    />
                  </div>
                  <small className="leave-gauge-footer">Solde annuel estimé : 30 jours</small>
                </div>
              </div>
            </div>

            {/* Recent payslips */}
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">Fiches de paie récentes</h3>
                <Link to="/paie" className="btn btn-ghost btn-sm dashboard-card-link">
                  Voir tout
                </Link>
              </div>
              {allPaies.length === 0 ? (
                <div className="dash-card-empty dash-card-empty-small">Aucune fiche de paie disponible.</div>
              ) : (
                <div className="payslip-dashboard-list">
                  {allPaies.slice(0, 3).map((paie) => (
                    <div key={paie.id} className="payslip-dashboard-item">
                      <div className="payslip-info">
                        <span className="payslip-month">
                          📅 {formatLabel(String(paie.mois))} {paie.annee}
                        </span>
                        <span className="payslip-salary">{formatMoney(paie.salaire_total)}</span>
                      </div>
                      <Link to="/paie" className="btn-download-payslip" title="Voir les détails">
                        👁️
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
