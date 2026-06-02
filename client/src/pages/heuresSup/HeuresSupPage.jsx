import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { employesAPI } from '../../api/employes.api';
import { heuresSupAPI } from '../../api/heuresSup.api';
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
  heureSupplementaire: '',
  date: today(),
  description: '',
};

function getEmployeId(record) {
  return record.employe?.id || record.employe?._id || record.employe || '';
}

function getEmployeName(record) {
  const nom = record.employe?.nom || '';
  const prenom = record.employe?.prenom || '';
  return `${nom} ${prenom}`.trim() || 'Employé';
}

function toApiDate(dateValue) {
  return new Date(`${dateValue}T00:00:00.000Z`).toISOString();
}

export default function HeuresSupPage() {
  const toast = useApiToast();
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const { user, role } = useAuth();
  const isAdminOrRH = role === ROLES.ADMIN || role === ROLES.RH;

  const [data, setData] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(urlSearch);

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
  }, []);

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  async function loadData() {
    setLoading(true);
    try {
      const params = {};
      if (!isAdminOrRH && user?.employeeId) params.employeId = user.employeeId;

      const requests = [heuresSupAPI.getAll(params)];
      if (isAdminOrRH) requests.push(employesAPI.getAll());

      const [heuresRes, employesRes] = await Promise.all(requests);
      setData(heuresRes.data || []);
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
    return data.filter((heure) => {
      const searchable = [
        getEmployeName(heure),
        heure.employe?.poste,
        heure.description,
      ].filter(Boolean).join(' ').toLowerCase();
      return searchable.includes(q);
    });
  }, [data, search]);

  function resetCreateForm() {
    setCreateForm({ ...EMPTY_FORM, date: today() });
  }

  function openEdit(heure) {
    setEditTarget(heure.id);
    setEditForm({
      employeId: getEmployeId(heure),
      heureSupplementaire: heure.heureSupplementaire ?? '',
      date: heure.date ? new Date(heure.date).toISOString().slice(0, 10) : today(),
      description: heure.description || '',
    });
  }

  function buildPayload(form) {
    return {
      date: toApiDate(form.date),
      heureSupplementaire: Number(form.heureSupplementaire),
      description: form.description?.trim() || undefined,
    };
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!createForm.employeId || !createForm.date || createForm.heureSupplementaire === '') {
      toast.error('Champs requis', 'Veuillez remplir l\'employé, la date et le nombre d\'heures.');
      return;
    }

    setCreateLoading(true);
    try {
      await heuresSupAPI.create({ employeId: createForm.employeId, ...buildPayload(createForm) });
      toast.success('Créé', 'Les heures supplémentaires ont été enregistrées.');
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
      await heuresSupAPI.update(editTarget, buildPayload(editForm));
      toast.success('Mis à jour', 'Les heures supplémentaires ont été mises à jour.');
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
      await heuresSupAPI.delete(deleteTarget);
      toast.success('Supprimé', 'Les heures supplémentaires ont été supprimées.');
      setData((prev) => prev.filter((h) => h.id !== deleteTarget));
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
          <h1>Heures supplémentaires</h1>
          <p>Suivez les heures supplémentaires utilisées dans le calcul de paie.</p>
        </div>
        <div className="page-header-actions">
          <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
            <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              + Ajouter des heures
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
          </div>
          <span className="table-count">{filtered.length} entrée{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="⏱"
            title={search ? 'Aucun résultat trouvé' : 'Aucune heure supplémentaire enregistrée'}
            description={search ? 'Essayez avec un autre employé ou une autre description.' : 'Aucune heure supplémentaire à afficher pour le moment.'}
            action={
              isAdminOrRH && !search ? (
                <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                  + Ajouter des heures
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
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((heure) => (
                  <tr key={heure.id}>
                    <td>
                      <div className="employee-cell">
                        <div className="avatar avatar-sm">
                          {(heure.employe?.nom?.[0] || 'H').toUpperCase()}
                        </div>
                        <div>
                          <div className="employee-name">{getEmployeName(heure)}</div>
                          <div className="employee-sub">{heure.employe?.poste || heure.employe?.utilisateur?.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(heure.date)}</td>
                    <td><Badge variant="warning">{heure.heureSupplementaire}h</Badge></td>
                    <td>{heure.description || '—'}</td>
                    <td>
                      <div className="table-actions">
                        <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
                          <button type="button" className="btn-icon" title="Modifier" onClick={() => openEdit(heure)}>
                            ✏️
                          </button>
                        </RoleGuard>
                        <RoleGuard roles={[ROLES.ADMIN]}>
                          <button type="button" className="btn-icon danger" title="Supprimer" onClick={() => setDeleteTarget(heure.id)}>
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

      <HeureSupFormModal
        isOpen={showCreateModal}
        title="Ajouter des heures supplémentaires"
        form={createForm}
        employes={employes}
        loading={createLoading}
        submitLabel="Enregistrer"
        onChange={setCreateForm}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
      />

      <HeureSupFormModal
        isOpen={!!editTarget}
        title="Modifier les heures supplémentaires"
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
        title="Supprimer les heures supplémentaires"
        message="Voulez-vous vraiment supprimer cette entrée ?"
        confirmLabel="Supprimer"
        confirmVariant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}

function HeureSupFormModal({
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
  const formId = lockEmployee ? 'heures-sup-edit' : 'heures-sup-create';

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
              value={form.heureSupplementaire}
              onChange={(e) => onChange({ ...form, heureSupplementaire: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor={`${formId}-description`}>Description</label>
          <textarea
            id={`${formId}-description`}
            className="form-textarea"
            placeholder="Ex. clôture mensuelle, intervention urgente..."
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
          />
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
