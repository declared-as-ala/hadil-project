import { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { congesAPI } from '../../api/conges.api';
import { employesAPI } from '../../api/employes.api';
import { useApiToast } from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import { formatDate, formatDays, formatLabel } from '../../utils/formatters';
import { ROLES, CONGE_TYPES } from '../../utils/constants';
import { AuthContext } from '../../context/AuthContext';
import './CongesPage.css';

// ─── Helpers ────────────────────────────────────────────────────────────────

const LEAVE_TYPE_ICONS = {
  annual: '🌴',
  sick: '🏥',
  maternity: '👶',
  paternity: '👨‍👧',
  unpaid: '💼',
  special: '⭐',
};

const STATUS_CONFIG = {
  pending: { label: 'En attente', className: 'badge-pending' },
  approved: { label: 'Approuvé', className: 'badge-approved' },
  rejected: { label: 'Refusé', className: 'badge-rejected' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return <span className={`lr-badge ${cfg.className}`}>{cfg.label}</span>;
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="lr-stat-card" style={{ '--accent': color }}>
      <div className="lr-stat-icon">{icon}</div>
      <div className="lr-stat-body">
        <div className="lr-stat-value">{value}</div>
        <div className="lr-stat-label">{label}</div>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  date_debut: '',
  periode: '',
  type_conge: 'annual',
  motif: '',
};

// ─── Employee View ───────────────────────────────────────────────────────────

function EmployeeView({ externalSearch = '' }) {
  const toast = useApiToast();
  const [requests, setRequests] = useState([]); // Ma liste de congés
  const [search, setSearch] = useState(externalSearch);
  const [loading, setLoading] = useState(true);  // Pendant chargement
  const [showForm, setShowForm] = useState(false); // Formulaire visible ?
  const [form, setForm] = useState(EMPTY_FORM);// Données nouveau congé
  const [editForm, setEditForm] = useState(null);// Données édition
  const [submitting, setSubmitting] = useState(false);// Pendant envoi

  useEffect(() => { loadMyRequests(); }, []);

  useEffect(() => {
    setSearch(externalSearch);
  }, [externalSearch]);

  async function loadMyRequests() {
    setLoading(true);
    try {
      const res = await congesAPI.getMy();
      setRequests(res.data || []);
    } catch (err) { toast.error(err); }
    finally { setLoading(false); }
  }

  function handleChange(e) {
    const { name, value, type } = e.target;
    setForm(f => ({ ...f, [name]: type === 'number' ? Number(value) : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.date_debut || !form.periode || !form.type_conge) {
      toast.error({ message: 'Veuillez remplir tous les champs obligatoires.' });
      return;
    }
    setSubmitting(true);
    try {
      await congesAPI.create({ ...form, periode: Number(form.periode) });
      toast.success('Soumis', 'Votre demande de congé a été envoyée pour examen.');
      setShowForm(false);
      setForm(EMPTY_FORM);
      loadMyRequests();
    } catch (err) { toast.error(err); }
    finally { setSubmitting(false); }
  }

  function handleEditChange(e) {
    const { name, value, type } = e.target;
    setEditForm(f => ({ ...f, [name]: type === 'number' ? Number(value) : value }));
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editForm.date_debut || !editForm.periode || !editForm.type_conge) {
      toast.error({ message: 'Veuillez remplir tous les champs obligatoires.' });
      return;
    }
    setSubmitting(true);
    try {
      await congesAPI.updateMy(editForm.id, { ...editForm, periode: Number(editForm.periode) });
      toast.success('Mis à jour', 'Votre demande de congé a été mise à jour.');
      setEditForm(null);
      loadMyRequests();
    } catch (err) { toast.error(err); }
    finally { setSubmitting(false); }
  }

  function handleEditClick(req) {
    setEditForm({
      id: req.id,
      date_debut: req.date_debut ? new Date(req.date_debut).toISOString().split('T')[0] : '',
      periode: req.periode,
      type_conge: req.type_conge,
      motif: req.motif || '',
    });
  }

  const counts = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const filteredRequests = requests.filter((req) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const searchable = [
      req.motif,
      req.status,
      req.type_conge,
      formatLabel(req.type_conge),
    ].filter(Boolean).join(' ').toLowerCase();
    return searchable.includes(q);
  });

  return (
    <div className="lr-page">
      {/* Header */}
      <div className="lr-header">
        <div className="lr-header-text">
          <h1 className="lr-title">Mes demandes de congés</h1>
          <p className="lr-subtitle">Suivre et gérer vos demandes de congés.</p>
        </div>
        <button className="lr-btn lr-btn-primary" onClick={() => setShowForm(true)}>
          <span>＋</span> Demande de congé
        </button>
      </div>

      {/* Summary cards */}
      <div className="lr-stats-row">
        <StatCard icon="📋" label="Total des demandes" value={counts.total} color="#6366f1" />
        <StatCard icon="⏳" label="En attente" value={counts.pending} color="#f59e0b" />
        <StatCard icon="✅" label="Approuvées" value={counts.approved} color="#10b981" />
        <StatCard icon="❌" label="Refusées" value={counts.rejected} color="#ef4444" />
      </div>

      {/* List */}
      {loading ? (
        <div className="lr-loading"><div className="lr-spinner" /></div>
      ) : requests.length === 0 ? (
        <div className="lr-empty">
          <div className="lr-empty-icon">🏖️</div>
          <h3>Aucune demande de congé pour le moment</h3>
          <p>Cliquez sur "Demande de congé" pour soumettre votre première demande.</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="lr-empty">
          <div className="lr-empty-icon">🔍</div>
          <h3>Aucun resultat trouve</h3>
          <p>Essayez avec un autre mot cle.</p>
        </div>
      ) : (
        <div className="lr-cards-grid">
          {filteredRequests.map(req => (
            <div key={req.id} className="lr-request-card">
              <div className="lr-request-card-header">
                <div className="lr-type-pill">
                  <span>{LEAVE_TYPE_ICONS[req.type_conge] || '📅'}</span>
                  <span>{formatLabel(req.type_conge)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {req.status === 'pending' && (
                    <button
                      onClick={() => handleEditClick(req)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                      title="Modifier la demande"
                    >
                      ✏️
                    </button>
                  )}
                  <StatusBadge status={req.status} />
                </div>
              </div>
              <div className="lr-request-card-body">
                <div className="lr-request-meta">
                  <div className="lr-meta-item">
                    <span className="lr-meta-label">Date de début</span>
                    <span className="lr-meta-value">{formatDate(req.date_debut)}</span>
                  </div>
                  <div className="lr-meta-item">
                    <span className="lr-meta-label">Durée</span>
                    <span className="lr-meta-value">{formatDays(req.periode)}</span>
                  </div>
                  <div className="lr-meta-item">
                    <span className="lr-meta-label">Soumise le</span>
                    <span className="lr-meta-value">{formatDate(req.createdAt)}</span>
                  </div>
                </div>
                {req.motif && (
                  <div className="lr-reason">
                    <span className="lr-meta-label">Motif</span>
                    <p>{req.motif}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Leave Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setForm(EMPTY_FORM); }}
        title="Nouvelle demande de congé"
        footer={
          <>
            <button className="lr-btn lr-btn-outline" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
              Annuler
            </button>
            <button className="lr-btn lr-btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Envoi...' : 'Soumettre la demande'}
            </button>
          </>
        }
      >
        <form className="lr-form" onSubmit={handleSubmit}>
          <div className="lr-form-row">
            <div className="lr-form-group">
              <label className="lr-label required">Date de début</label>
              <input
                type="date"
                name="date_debut"
                className="lr-input"
                value={form.date_debut}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="lr-form-group">
              <label className="lr-label required">Durée (jours)</label>
              <input
                type="number"
                name="periode"
                className="lr-input"
                value={form.periode}
                onChange={handleChange}
                min="1"
                max="365"
                placeholder=""
                required
              />
            </div>
          </div>
          <div className="lr-form-group">
            <label className="lr-label">Type de congé</label>
            <select name="type_conge" className="lr-select" value={form.type_conge} onChange={handleChange} required>
              {Object.values(CONGE_TYPES).map(t => (
                <option key={t} value={t}>{LEAVE_TYPE_ICONS[t]} {formatLabel(t)}</option>
              ))}
            </select>
          </div>
          <div className="lr-form-group">
            <label className="lr-label">Motif <span className="lr-optional">(optionnel)</span></label>
            <textarea
              name="motif"
              className="lr-textarea"
              value={form.motif}
              onChange={handleChange}
              rows={3}
              placeholder="Décrivez brièvement le motif de votre congé..."
            />
          </div>
        </form>
      </Modal>

      {/* Edit Leave Modal */}
      <Modal
        isOpen={!!editForm}
        onClose={() => setEditForm(null)}
        title="Modifier la demande de congé"
        footer={
          <>
            <button className="lr-btn lr-btn-outline" onClick={() => setEditForm(null)}>
              Annuler
            </button>
            <button className="lr-btn lr-btn-primary" onClick={handleUpdate} disabled={submitting}>
              {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </>
        }
      >
        {editForm && (
          <form className="lr-form" onSubmit={handleUpdate}>
            <div className="lr-form-row">
              <div className="lr-form-group">
                <label className="lr-label required">Date de début</label>
                <input
                  type="date"
                  name="date_debut"
                  className="lr-input"
                  value={editForm.date_debut}
                  onChange={handleEditChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="lr-form-group">
                <label className="lr-label required">Durée (jours)</label>
                <input
                  type="number"
                  name="periode"
                  className="lr-input"
                  value={editForm.periode}
                  onChange={handleEditChange}
                  min="1"
                  max="365"
                  required
                />
              </div>
            </div>
            <div className="lr-form-group">
              <label className="lr-label required">Type de congé</label>
              <select name="type_conge" className="lr-select" value={editForm.type_conge} onChange={handleEditChange} required>
                {Object.values(CONGE_TYPES).map(t => (
                  <option key={t} value={t}>{LEAVE_TYPE_ICONS[t]} {formatLabel(t)}</option>
                ))}
              </select>
            </div>
            <div className="lr-form-group">
              <label className="lr-label">Motif <span className="lr-optional">(optionnel)</span></label>
              <textarea
                name="motif"
                className="lr-textarea"
                value={editForm.motif}
                onChange={handleEditChange}
                rows={3}
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

// ─── Admin / HR View ─────────────────────────────────────────────────────────

function AdminView({ externalSearch = '' }) {
  const toast = useApiToast();
  const [requests, setRequests] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterEmploye, setFilterEmploye] = useState('');
  const [search, setSearch] = useState(externalSearch);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ employeId: '', date_debut: '', periode: '', type_conge: 'annual', motif: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);

  useEffect(() => { loadData(); }, [filterStatus, filterType, filterEmploye]);

  useEffect(() => {
    setSearch(externalSearch);
  }, [externalSearch]);

  //charger tout ce dont l’Admin/RH a besoin
  async function loadData() {
    setLoading(true);
    try {
      const [rRes, eRes, sRes] = await Promise.all([
        congesAPI.getAll({
          status: filterStatus || undefined,
          type_conge: filterType || undefined,
          employeId: filterEmploye || undefined,
        }),
        employesAPI.getAll(),
        congesAPI.getStats(),
      ]);
      setRequests(rRes.data || []);
      setEmployes(eRes.data || []);
      setStats(sRes.data || {});
    } catch (err) { toast.error(err); }
    finally { setLoading(false); }
  }

  async function handleStatusAction(id, status) {
    setActionLoading(id + status);
    try {
      await congesAPI.updateStatus(id, status);
      toast.success(
        status === 'approved' ? 'Approuvée' : 'Refusée',
        `La demande de congé a été ${status === 'approved' ? 'approuvée' : 'refusée'}.`
      );
      loadData();
    } catch (err) { toast.error(err); }
    finally { setActionLoading(null); }
  }

  async function handleDelete(id) {
    if (!window.confirm("Voulez-vous vraiment supprimer cette demande de congé ?")) return;
    setActionLoading(id + 'delete');
    try {
      await congesAPI.delete(id);
      toast.success('Supprimée', 'Demande de congé supprimée avec succès.');
      loadData();
    } catch (err) { toast.error(err); }
    finally { setActionLoading(null); }
  }

  function handleCreateChange(e) {
    const { name, value } = e.target;
    setCreateForm(f => ({ ...f, [name]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!createForm.employeId || !createForm.date_debut || !createForm.periode) {
      toast.error({ message: 'Veuillez remplir tous les champs obligatoires.' });
      return;
    }
    setCreateLoading(true);
    try {
      await congesAPI.createAdmin({ ...createForm, periode: Number(createForm.periode) });
      toast.success('Créée', 'Demande de congé créée avec succès.');
      setShowCreateModal(false);
      setCreateForm({ employeId: '', date_debut: '', periode: '', type_conge: 'annual', motif: '' });
      loadData();
    } catch (err) { toast.error(err); }
    finally { setCreateLoading(false); }
  }

  function clearFilters() {
    setFilterStatus('');
    setFilterType('');
    setFilterEmploye('');
    setSearch('');
  }

  const filtered = requests.filter(r => {
    if (!search) return true;
    const name = `${r.employe?.nom || ''} ${r.employe?.prenom || ''}`.toLowerCase();
    return name.includes(search.toLowerCase()) || (r.motif || '').toLowerCase().includes(search.toLowerCase());
  });

  const hasFilters = filterStatus || filterType || filterEmploye || search;

  return (
    <div className="lr-page">
      {/* Header */}
      <div className="lr-header">
        <div className="lr-header-text">
          <h1 className="lr-title">Demandes de congés</h1>
          <p className="lr-subtitle">Examinez, approuvez ou refusez les demandes de congés des employés.</p>
        </div>
        <button className="lr-btn lr-btn-primary" onClick={() => setShowCreateModal(true)}>
          <span>＋</span> Créer une demande
        </button>
      </div>

      {/* Stats */}
      <div className="lr-stats-row">
        <StatCard icon="📋" label="Total" value={stats.total ?? 0} color="#6366f1" />
        <StatCard icon="⏳" label="En attente" value={stats.pending ?? 0} color="#f59e0b" />
        <StatCard icon="✅" label="Approuvées" value={stats.approved ?? 0} color="#10b981" />
        <StatCard icon="❌" label="Refusées" value={stats.rejected ?? 0} color="#ef4444" />
      </div>

      {/* Filters */}
      <div className="lr-filters-bar">
        <input
          type="text"
          className="lr-input lr-search"
          placeholder="🔍  Rechercher un employé ou un motif..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="lr-select lr-select-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="approved">Approuvé</option>
          <option value="rejected">Refusé</option>
        </select>
        <select className="lr-select lr-select-sm" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Tous les types</option>
          {Object.values(CONGE_TYPES).map(t => (
            <option key={t} value={t}>{formatLabel(t)}</option>
          ))}
        </select>
        <select className="lr-select lr-select-sm" value={filterEmploye} onChange={e => setFilterEmploye(e.target.value)}>
          <option value="">Tous les employés</option>
          {employes.map(e => (
            <option key={e.id} value={e.id}>
              {e.nom} {e.prenom}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button className="lr-btn lr-btn-ghost" onClick={clearFilters} title="Réinitialiser les filtres">✕ Réinitialiser</button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="lr-loading"><div className="lr-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="lr-empty">
          <div className="lr-empty-icon">🔍</div>
          <h3>{hasFilters ? 'Aucun résultat trouvé' : 'Aucune demande de congé pour le moment'}</h3>
          <p>{hasFilters ? 'Essayez d\'ajuster vos filtres.' : 'Les demandes apparaîtront ici une fois soumises.'}</p>
          {hasFilters && <button className="lr-btn lr-btn-outline" onClick={clearFilters}>Réinitialiser les filtres</button>}
        </div>
      ) : (
        <div className="lr-table-container">
          <div className="lr-table-meta">
            <span className="lr-table-count">{filtered.length} demande{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="lr-table-wrapper">
            <table className="lr-table">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Type</th>
                  <th>Date de début</th>
                  <th>Durée</th>
                  <th>Motif</th>
                  <th>Statut</th>
                  <th>Soumise le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(req => {
                  const emp = req.employe;
                  const initials = `${emp?.nom?.[0] || ''}${emp?.prenom?.[0] || ''}`.toUpperCase() || '?';
                  const isPending = req.status === 'pending';
                  return (
                    <tr key={req.id}>
                      <td>
                        <div className="lr-employee-cell">
                          <div className="lr-avatar">{initials}</div>
                          <div>
                            <div className="lr-employee-name">{emp?.nom} {emp?.prenom}</div>
                            <div className="lr-employee-dept">{emp?.utilisateur?.email || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="lr-type-pill">
                          <span>{LEAVE_TYPE_ICONS[req.type_conge] || '📅'}</span>
                          <span>{formatLabel(req.type_conge)}</span>
                        </div>
                      </td>
                      <td className="lr-date">{formatDate(req.date_debut)}</td>
                      <td><span className="lr-days">{formatDays(req.periode)}</span></td>
                      <td className="lr-reason-cell">{req.motif ? <span title={req.motif}>{req.motif.length > 40 ? req.motif.slice(0, 40) + '…' : req.motif}</span> : <span className="lr-none">—</span>}</td>
                      <td><StatusBadge status={req.status} /></td>
                      <td className="lr-date">{formatDate(req.createdAt)}</td>
                      <td>
                        <div className="lr-actions">
                          {isPending ? (
                            <>
                              <button
                                className="lr-action-btn approve"
                                disabled={!!actionLoading}
                                onClick={() => handleStatusAction(req.id, 'approved')}
                                title="Approuver"
                              >
                                {actionLoading === req.id + 'approved' ? '…' : '✓ Approuver'}
                              </button>
                              <button
                                className="lr-action-btn reject"
                                disabled={!!actionLoading}
                                onClick={() => handleStatusAction(req.id, 'rejected')}
                                title="Refuser"
                              >
                                {actionLoading === req.id + 'rejected' ? '…' : '✕ Refuser'}
                              </button>
                            </>
                          ) : (
                            <button
                              className="lr-action-btn reset"
                              disabled={!!actionLoading}
                              onClick={() => handleStatusAction(req.id, 'pending')}
                              title="Réinitialiser"
                            >
                              ↺ Réinitialiser
                            </button>
                          )}
                          <button
                            className="lr-action-btn reject"
                            style={{ marginLeft: '4px' }}
                            disabled={!!actionLoading}
                            onClick={() => handleDelete(req.id)}
                            title="Supprimer"
                          >
                            {actionLoading === req.id + 'delete' ? '…' : '🗑️'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); }}
        title="Ajouter une demande"
        footer={
          <>
            <button className="lr-btn lr-btn-outline" onClick={() => setShowCreateModal(false)}>Annuler</button>
            <button className="lr-btn lr-btn-primary" onClick={handleCreate} disabled={createLoading}>
              {createLoading ? 'Création...' : 'Créer la demande'}
            </button>
          </>
        }
      >
        <form className="lr-form" onSubmit={handleCreate}>
          <div className="lr-form-group">
            <label className="lr-label required">Employé</label>
            <select name="employeId" className="lr-select" value={createForm.employeId} onChange={handleCreateChange} required>
              <option value="">Sélectionner un employé...</option>
              {employes.map(e => (
                <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>
              ))}
            </select>
          </div>
          <div className="lr-form-row">
            <div className="lr-form-group">
              <label className="lr-label required">Date de début</label>
              <input type="date" name="date_debut" className="lr-input" value={createForm.date_debut} onChange={handleCreateChange} required />
            </div>
            <div className="lr-form-group">
              <label className="lr-label required">Durée (jours)</label>
              <input type="number" name="periode" className="lr-input" value={createForm.periode} onChange={handleCreateChange} min="1" required />
            </div>
          </div>
          <div className="lr-form-group">
            <label className="lr-label required">Type de congé</label>
            <select name="type_conge" className="lr-select" value={createForm.type_conge} onChange={handleCreateChange} required>
              {Object.values(CONGE_TYPES).map(t => (
                <option key={t} value={t}>{LEAVE_TYPE_ICONS[t]} {formatLabel(t)}</option>
              ))}
            </select>
          </div>
          <div className="lr-form-group">
            <label className="lr-label">Motif <span className="lr-optional">(optionnel)</span></label>
            <textarea name="motif" className="lr-textarea" value={createForm.motif} onChange={handleCreateChange} rows={3} placeholder="Ajouter un motif..." />
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Root Component ──────────────────────────────────────────────────────────

export default function CongesPage() {
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const role = user?.role;

  if (role === ROLES.ADMIN || role === ROLES.RH) {
    return <AdminView externalSearch={urlSearch} />;
  }
  return <EmployeeView externalSearch={urlSearch} />;
}
