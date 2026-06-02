import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { absencesAPI } from '../../api/absences.api';
import { employesAPI } from '../../api/employes.api';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import RoleGuard from '../../components/common/RoleGuard';
import { useApiToast } from '../../components/common/Toast';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import '../CrudPage.css';

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  employeId: '',
  date: today(),
  nombre_des_heures: '',
  statut: 'non_justifié',
  raison: '',
};

const STATUS_OPTIONS = [
  { value: 'non_justifié', label: 'Non justifié' },
  { value: 'justifié', label: 'Justifié' },
];

function getEmployeId(record) {
  return record.employe?.id || record.employe?._id || record.employe || '';
}

function getEmployeName(record) {
  const nom = record.employe?.nom || '';
  const prenom = record.employe?.prenom || '';
  return `${nom} ${prenom}`.trim() || 'Employé';
}

function getStatusBadge(statut) {
  if (statut === 'justifié') return <Badge variant="success">Justifié</Badge>;
  return <Badge variant="danger">Non justifié</Badge>;
}

export default function AbsencesPage() {
  const toast = useApiToast();
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const { user, role } = useAuth();
  const isAdminOrRH = role === ROLES.ADMIN || role === ROLES.RH;

  const [data, setData] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(urlSearch);
  const [statusFilter, setStatusFilter] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [createLoading, setCreateLoading] = useState(false);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  async function loadData() {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.statut = statusFilter;
      if (!isAdminOrRH && user?.employeeId) params.employeId = user.employeeId;

      const requests = [absencesAPI.getAll(params)];
      if (isAdminOrRH) requests.push(employesAPI.getAll());

      const [absencesRes, employesRes] = await Promise.all(requests);
      setData(absencesRes.data || []);
      if (employesRes) setEmployes(employesRes.data || []);
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((absence) => {
      const searchable = [
        getEmployeName(absence),
        absence.employe?.poste,
        absence.raison,
      ].filter(Boolean).join(' ').toLowerCase();
      return searchable.includes(q);
    });
  }, [data, search]);

  function resetCreateForm() {
    setCreateForm({ ...EMPTY_FORM, date: today() });
  }

  function openEdit(absence) {
    setEditTarget(absence.id);
    setEditForm({
      employeId: getEmployeId(absence),
      date: absence.date ? new Date(absence.date).toISOString().slice(0, 10) : today(),
      nombre_des_heures: absence.nombre_des_heures ?? '',
      statut: absence.statut || 'non_justifié',
      raison: absence.raison || '',
    });
  }

  function buildPayload(form) {
    return {
      date: form.date,
      nombre_des_heures: Number(form.nombre_des_heures),
      statut: form.statut,
      raison: form.raison?.trim() || undefined,
    };
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!createForm.employeId || !createForm.date || createForm.nombre_des_heures === '') {
      toast.error('Champs requis', 'Veuillez remplir l\'employé, la date et le nombre d\'heures.');
      return;
    }

    setCreateLoading(true);
    try {
      await absencesAPI.create({ employeId: createForm.employeId, ...buildPayload(createForm) });
      toast.success('Créé', 'L\'absence a été enregistrée.');
      setShowCreateModal(false);
      resetCreateForm();
      loadData();
    } catch (err) {
      toast.error(err);
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!editTarget) return;

    setEditLoading(true);
    try {
      await absencesAPI.update(editTarget, buildPayload(editForm));
      toast.success('Mis à jour', 'L\'absence a été mise à jour.');
      setEditTarget(null);
      loadData();
    } catch (err) {
      toast.error(err);
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    try {
      await absencesAPI.delete(deleteTarget);
      toast.success('Supprimé', 'L\'absence a été supprimée.');
      setData((prev) => prev.filter((a) => a.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err);
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading && data.length === 0) {
    return <div className="crud-loading"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Absences</h1>
          <p>Suivez les absences, les heures perdues et leur justification.</p>
        </div>
        <div className="page-header-actions">
          <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
            <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              + Ajouter une absence
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 180 }}
            >
              <option value="">Tous les statuts</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <span className="table-count">{filtered.length} absence{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="📅"
            title={search || statusFilter ? 'Aucun résultat trouvé' : 'Aucune absence enregistrée'}
            description={search || statusFilter ? 'Essayez de modifier les filtres.' : 'Aucune absence à afficher pour le moment.'}
            action={
              isAdminOrRH && !search && !statusFilter ? (
                <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                  + Ajouter une absence
                </button>
              ) : null
            }
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Date</th>
                  <th>Heures</th>
                  <th>Statut</th>
                  <th>Raison</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((absence) => (
                  <tr key={absence.id}>
                    <td>
                      <div className="employee-cell">
                        <div className="avatar avatar-sm">
                          {(absence.employe?.nom?.[0] || 'A').toUpperCase()}
                        </div>
                        <div>
                          <div className="employee-name">{getEmployeName(absence)}</div>
                          <div className="employee-sub">{absence.employe?.poste || absence.employe?.utilisateur?.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(absence.date)}</td>
                    <td><Badge variant="info">{absence.nombre_des_heures}h</Badge></td>
                    <td>{getStatusBadge(absence.statut)}</td>
                    <td>{absence.raison || '—'}</td>
                    <td>
                      <div className="table-actions">
                        <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
                          <button type="button" className="btn-icon" title="Modifier" onClick={() => openEdit(absence)}>
                            ✏️
                          </button>
                        </RoleGuard>
                        <RoleGuard roles={[ROLES.ADMIN]}>
                          <button type="button" className="btn-icon danger" title="Supprimer" onClick={() => setDeleteTarget(absence.id)}>
                            🗑️
                          </button>
                        </RoleGuard>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AbsenceFormModal
        isOpen={showCreateModal}
        title="Ajouter une absence"
        form={createForm}
        employes={employes}
        loading={createLoading}
        submitLabel="Enregistrer"
        onChange={setCreateForm}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
      />

      <AbsenceFormModal
        isOpen={!!editTarget}
        title="Modifier l'absence"
        form={editForm}
        employes={employes}
        loading={editLoading}
        submitLabel="Enregistrer"
        onChange={setEditForm}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
        lockEmployee
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer l'absence"
        message="Voulez-vous vraiment supprimer cette absence ?"
        confirmLabel="Supprimer"
        confirmVariant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}

function AbsenceFormModal({
  isOpen,
  title,
  form,
  employes,
  loading,
  submitLabel,
  onChange,
  onClose,
  onSubmit,
  lockEmployee = false,
}) {
  const formId = lockEmployee ? 'absence-edit' : 'absence-create';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label className="form-label form-label-required" htmlFor={`${formId}-employe`}>Employé</label>
          <select
            id={`${formId}-employe`}
            className="form-select"
            value={form.employeId}
            onChange={(e) => onChange({ ...form, employeId: e.target.value })}
            disabled={lockEmployee}
            required
          >
            <option value="">Sélectionner un employé...</option>
            {employes.map((employe) => (
              <option key={employe.id} value={employe.id}>
                {employe.nom} {employe.prenom}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor={`${formId}-date`}>Date</label>
            <input
              id={`${formId}-date`}
              type="date"
              className="form-input"
              value={form.date}
              onChange={(e) => onChange({ ...form, date: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor={`${formId}-heures`}>Nombre d'heures</label>
            <input
              id={`${formId}-heures`}
              type="number"
              min="0"
              step="0.5"
              className="form-input"
              value={form.nombre_des_heures}
              onChange={(e) => onChange({ ...form, nombre_des_heures: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor={`${formId}-statut`}>Statut</label>
            <select
              id={`${formId}-statut`}
              className="form-select"
              value={form.statut}
              onChange={(e) => onChange({ ...form, statut: e.target.value })}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor={`${formId}-raison`}>Raison</label>
            <input
              id={`${formId}-raison`}
              type="text"
              className="form-input"
              placeholder="Ex. certificat médical"
              value={form.raison}
              onChange={(e) => onChange({ ...form, raison: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Enregistrement...' : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
