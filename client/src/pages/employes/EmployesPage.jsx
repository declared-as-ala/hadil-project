import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { employesAPI } from '../../api/employes.api';
import { congesAPI } from '../../api/conges.api';
import { useApiToast } from '../../components/common/Toast';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import EmployeFormPage from './EmployeFormPage';
import { formatDate, formatLabel } from '../../utils/formatters';
import RoleGuard from '../../components/common/RoleGuard';
import { ROLES } from '../../utils/constants';
import '../CrudPage.css';

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

export default function EmployesPage() {
  const toast = useApiToast();
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(urlSearch);
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewEmp, setViewEmp] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    loadEmployes();
  }, [statusFilter]);

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  async function loadEmployes() {
    setLoading(true);
    try {
      const [employesRes, congesRes] = await Promise.allSettled([
        employesAPI.getAll(),
        congesAPI.getAll({ status: 'approved' }),
      ]);

      if (employesRes.status === 'rejected') {
        throw employesRes.reason;
      }

      const activeLeaveEmployeeIds = new Set(
        (congesRes.status === 'fulfilled' ? congesRes.value.data || [] : [])
          .filter(isCongeActiveToday)
          .map((conge) => getEntityId(conge.employe))
          .filter(Boolean)
      );

      setData((employesRes.value.data || []).map((employe) => {
        if (employe.status === 'inactif' || employe.status === 'inactiff') return employe;
        return {
          ...employe,
          status: activeLeaveEmployeeIds.has(getEntityId(employe)) ? 'en_conge' : 'actif',
        };
      }));
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await employesAPI.delete(deleteTarget);
      toast.success('Supprimé', 'L\'employé et son compte ont été supprimés.');
      setData((prev) => prev.filter((e) => e.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err);
    } finally {
      setDeleteLoading(false);
    }
  }

  const filtered = data.filter((e) => {
    if (statusFilter && e.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const nom = (e.nom || '').toLowerCase();
    const prenom = (e.prenom || '').toLowerCase();
    const email = (e.utilisateur?.email || '').toLowerCase();
    const poste = (e.poste || '').toLowerCase();
    return nom.includes(q) || prenom.includes(q) || email.includes(q) || poste.includes(q);
  });

  if (loading) return <div className="crud-loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Employés</h1>
          <p>Gérez les employés de votre organisation.</p>
        </div>
        <div className="page-header-actions">
          <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
            <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              + Ajouter un employé
            </button>
          </RoleGuard>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-filters">
            <input
              type="text"
              className="form-input"
              placeholder="Rechercher un employé..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 260 }}
            />
            <select
              className="form-select"
              style={{ width: 160 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
              <option value="en_conge">En congé</option>
            </select>
          </div>
          <span className="table-count">{filtered.length} employé{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="👥"
            title={search ? 'Aucun résultat trouvé' : 'Aucun employé pour le moment'}
            description={search ? 'Essayez d\'ajuster votre recherche.' : 'Ajoutez votre premier employé pour commencer.'}
            action={
              !search && (
                <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
                  <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    + Ajouter un employé
                  </button>
                </RoleGuard>
              )
            }
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Poste</th>
                  <th>Date d'embauche</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => {
                  const statusVariant =
                    emp.status === 'actif' ? 'success' : emp.status === 'inactif' ? 'gray' : 'warning';
                  return (
                    <tr key={emp.id}>
                      <td>
                        <div className="employee-cell">
                          <div className="avatar avatar-sm">
                            {(emp.nom?.[0] || 'E').toUpperCase()}
                          </div>
                          <div>
                            <div className="employee-name">{emp.nom} {emp.prenom}</div>
                            <div className="employee-sub">{emp.utilisateur?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{emp.poste || '—'}</td>
                      <td>{formatDate(emp.dateEmbauche)}</td>
                      <td>
                        <Badge variant={statusVariant}>{formatLabel(emp.status)}</Badge>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-icon" title="Voir" onClick={() => setViewEmp(emp)}>
                            👁️
                          </button>
                          <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
                            <button
                              type="button"
                              className="btn-icon"
                              title="Modifier"
                              onClick={() => setEditTarget(emp.id)}
                            >
                              ✏️
                            </button>
                            <RoleGuard roles={[ROLES.ADMIN]}>
                              <button
                                className="btn-icon danger"
                                title="Supprimer"
                                onClick={() => setDeleteTarget(emp.id)}
                              >
                                🗑️
                              </button>
                            </RoleGuard>
                          </RoleGuard>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Ajouter un employé"
        size="lg"
      >
        <EmployeFormPage
          embedded
          onCancel={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadEmployes();
          }}
        />
      </Modal>

      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Modifier l'employé"
        size="lg"
      >
        {editTarget && (
          <EmployeFormPage
            embedded
            employeId={editTarget}
            onCancel={() => setEditTarget(null)}
            onSuccess={() => {
              setEditTarget(null);
              loadEmployes();
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer l'employé"
        message="Voulez-vous vraiment supprimer cet employé ? Son compte de connexion sera également supprimé. Cette action est irréversible."
        confirmLabel="Supprimer"
        confirmVariant="danger"
        loading={deleteLoading}
      />

      <Modal
        isOpen={!!viewEmp}
        onClose={() => setViewEmp(null)}
        title="Détails de l'employé"
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setViewEmp(null)}>Fermer</button>
            <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
              {viewEmp && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setEditTarget(viewEmp.id);
                    setViewEmp(null);
                  }}
                >
                  ✏️ Modifier
                </button>
              )}
            </RoleGuard>
          </>
        }
      >
        {viewEmp && (
          <>
            <div className="detail-header">
              <div className="avatar avatar-lg" style={{ borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {(viewEmp.nom?.[0] || 'E').toUpperCase()}
              </div>
              <div className="detail-header-info">
                <div className="detail-header-title">{viewEmp.nom} {viewEmp.prenom}</div>
                <div className="detail-header-subtitle">{viewEmp.utilisateur?.email}</div>
              </div>
              <Badge variant={viewEmp.status === 'actif' ? 'success' : viewEmp.status === 'inactif' ? 'gray' : 'warning'}>
                {formatLabel(viewEmp.status)}
              </Badge>
            </div>
            <div className="detail-grid">
              <div className="detail-field">
                <div className="detail-field-label">Poste</div>
                <div className="detail-field-value">{viewEmp.poste || '—'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Téléphone</div>
                <div className="detail-field-value">{viewEmp.telephone || '—'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Date d'embauche</div>
                <div className="detail-field-value">{formatDate(viewEmp.dateEmbauche)}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Salaire de base</div>
                <div className="detail-field-value">
                  {viewEmp.salaire_base != null ? `${Number(viewEmp.salaire_base).toLocaleString()} DT` : '—'}
                </div>
              </div>
              {viewEmp.salaire_total != null && viewEmp.salaire_total !== viewEmp.salaire_base && (
                <div className="detail-field" style={{ backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '8px 12px' }}>
                  <div className="detail-field-label" style={{ color: '#16a34a', fontWeight: '600' }}>Salaire total calculé (Paie)</div>
                  <div className="detail-field-value" style={{ color: '#15803d', fontWeight: 'bold' }}>
                    {viewEmp.salaire_total.toLocaleString()} DT
                  </div>
                </div>
              )}
              <div className="detail-field">
                <div className="detail-field-label">Taux heures sup</div>
                <div className="detail-field-value">
                  {viewEmp.prix_heure_sup != null ? `${Number(viewEmp.prix_heure_sup).toLocaleString()} DT/h` : '—'}
                </div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Créé le</div>
                <div className="detail-field-value">{formatDate(viewEmp.createdAt)}</div>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
