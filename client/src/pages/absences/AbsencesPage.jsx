import { useState, useEffect } from 'react';
import { absencesAPI } from '../../api/absences.api';
import { employesAPI } from '../../api/employes.api';
import { useApiToast } from '../../components/common/Toast';
import { useAuth } from '../../hooks/useAuth';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/formatters';
import RoleGuard from '../../components/common/RoleGuard';
import { ROLES } from '../../utils/constants';
import '../CrudPage.css';

export default function AbsencesPage() {
  const toast = useApiToast();
  const { user, role } = useAuth();
  const isAdmin = role === ROLES.ADMIN;
  const isAdminOrRH = isAdmin || role === ROLES.RH;
  const [data, setData] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeId: '', date: '', nombre_des_heures: '', raison: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ employeId: '', date: '', nombre_des_heures: '', raison: '' });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Employees should only see their own absences. Admin/RH see everything.
      const absParams = isAdminOrRH ? {} : (user?.employeeId ? { employeId: user.employeeId } : {});
      const tasks = [absencesAPI.getAll(absParams)];
      if (isAdminOrRH) tasks.push(employesAPI.getAll());
      const results = await Promise.all(tasks);
      setData(results[0].data || []);
      if (isAdminOrRH) setEmployes(results[1].data || []);
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
      await absencesAPI.delete(deleteTarget);
      toast.success('Deleted', 'Absence has been removed.');
      setData((prev) => prev.filter((a) => a.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormLoading(true);
    try {
      await absencesAPI.create(form);
      toast.success('Created', 'Absence has been added.');
      setShowForm(false);
      setForm({ employeId: '', date: '', nombre_des_heures: '', raison: '' });
      loadData();
    } catch (err) {
      toast.error(err);
    } finally {
      setFormLoading(false);
    }
  }

  function openEdit(a) {
    setEditTarget(a.id);
    setEditForm({
      employeId: a.employe?.id || a.employe?._id || a.employe || '',
      date: a.date ? new Date(a.date).toISOString().slice(0, 10) : '',
      nombre_des_heures: a.nombre_des_heures ?? '',
      raison: a.raison || '',
    });
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!editTarget) return;
    setEditLoading(true);
    try {
      await absencesAPI.update(editTarget, editForm);
      toast.success('Updated', 'Absence updated.');
      setEditTarget(null);
      loadData();
    } catch (err) {
      toast.error(err);
    } finally {
      setEditLoading(false);
    }
  }

  const filtered = data.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const empName = `${a.employe?.nom || ''} ${a.employe?.prenom || ''}`.toLowerCase();
    return empName.includes(q) || (a.raison || '').toLowerCase().includes(q);
  });

  if (loading) return <div className="crud-loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Absences</h1>
          <p>Track employee absences.</p>
        </div>
        <div className="page-header-actions">
          <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Absence</button>
          </RoleGuard>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <input
            type="text"
            className="form-input"
            placeholder="Search absences..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 260 }}
          />
          <span className="table-count">{filtered.length} absence{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="📅" title="No absences recorded" description="All employees are present!" />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Hours</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const emp = a.employe;
                  return (
                    <tr key={a.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="avatar avatar-sm">
                            {(emp?.nom?.[0] || 'A').toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{emp?.nom} {emp?.prenom}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>{emp?.utilisateur?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{formatDate(a.date)}</td>
                      <td><Badge variant="warning">{a.nombre_des_heures}h</Badge></td>
                      <td>{a.raison || '—'}</td>
                      <td>
                        <div className="table-actions">
                          <RoleGuard roles={[ROLES.ADMIN]}>
                            <button className="btn-icon" title="Edit" onClick={() => openEdit(a)}>✏️</button>
                            <button className="btn-icon danger" title="Delete" onClick={() => setDeleteTarget(a.id)}>
                              🗑️
                            </button>
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

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Absence"
        message="Remove this absence record?"
        loading={deleteLoading}
      />

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add Absence"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={formLoading}>
              {formLoading ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label form-label-required">Employee</label>
            <select
              className="form-select"
              value={form.employeId}
              onChange={(e) => setForm({ ...form, employeId: e.target.value })}
              required
            >
              <option value="">Select employee...</option>
              {employes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nom} {e.prenom}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-required">Date</label>
              <input type="date" className="form-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label form-label-required">Hours</label>
              <input type="number" min="0" className="form-input" value={form.nombre_des_heures} onChange={(e) => setForm({ ...form, nombre_des_heures: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea className="form-textarea" value={form.raison} onChange={(e) => setForm({ ...form, raison: e.target.value })} />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Absence"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEditTarget(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEdit} disabled={editLoading}>
              {editLoading ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <form onSubmit={handleEdit}>
          <div className="form-group">
            <label className="form-label form-label-required">Employee</label>
            <select
              className="form-select"
              value={editForm.employeId}
              onChange={(e) => setEditForm({ ...editForm, employeId: e.target.value })}
              required
            >
              <option value="">Select employee...</option>
              {employes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nom} {e.prenom}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-required">Date</label>
              <input type="date" className="form-input" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label form-label-required">Hours</label>
              <input type="number" min="0" className="form-input" value={editForm.nombre_des_heures} onChange={(e) => setEditForm({ ...editForm, nombre_des_heures: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea className="form-textarea" value={editForm.raison} onChange={(e) => setEditForm({ ...editForm, raison: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
