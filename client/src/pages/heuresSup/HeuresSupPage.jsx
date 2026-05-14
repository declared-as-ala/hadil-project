import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { heuresSupAPI } from '../../api/heuresSup.api';
import { employesAPI } from '../../api/employes.api';
import { useApiToast } from '../../components/common/Toast';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/formatters';
import RoleGuard from '../../components/common/RoleGuard';
import { ROLES } from '../../utils/constants';
import '../CrudPage.css';

export default function HeuresSupPage() {
  const toast = useApiToast();
  const [data, setData] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeId: '', heureSupplementaire: '', date: '', description: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ employeId: '', heureSupplementaire: '', date: '', description: '' });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [hRes, eRes] = await Promise.all([heuresSupAPI.getAll(), employesAPI.getAll()]);
      setData(hRes.data || []);
      setEmployes(eRes.data || []);
    } catch (err) { toast.error(err); }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await heuresSupAPI.delete(deleteTarget);
      toast.success('Deleted', 'Overtime record removed.');
      setData((p) => p.filter((h) => h.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) { toast.error(err); }
    finally { setDeleteLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormLoading(true);
    try {
      await heuresSupAPI.create(form);
      toast.success('Created', 'Overtime added.');
      setShowForm(false);
      setForm({ employeId: '', heureSupplementaire: '', date: '', description: '' });
      loadData();
    } catch (err) { toast.error(err); }
    finally { setFormLoading(false); }
  }

  function openEdit(h) {
    setEditTarget(h.id);
    setEditForm({
      employeId: h.employe?.id || h.employe?._id || h.employe || '',
      heureSupplementaire: h.heureSupplementaire ?? '',
      date: h.date ? new Date(h.date).toISOString().slice(0, 10) : '',
      description: h.description || '',
    });
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!editTarget) return;
    setEditLoading(true);
    try {
      await heuresSupAPI.update(editTarget, editForm);
      toast.success('Updated', 'Overtime updated.');
      setEditTarget(null);
      loadData();
    } catch (err) { toast.error(err); }
    finally { setEditLoading(false); }
  }

  const filtered = data.filter((h) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const emp = h.employe;
    return `${emp?.nom || ''} ${emp?.prenom || ''}`.toLowerCase().includes(q);
  });

  if (loading) return <div className="crud-loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1>Overtime Hours</h1><p>Track employee overtime hours.</p></div>
        <div className="page-header-actions">
          <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Ajouter </button>
          </RoleGuard>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <input type="text" className="form-input" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 260 }} />
          <span className="table-count">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="⏰" title="No overtime records" description="No overtime has been recorded." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Employee</th><th>Date</th><th>Hours</th><th>Description</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((h) => {
                  const emp = h.employe;
                  return (
                    <tr key={h.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar avatar-sm">{(emp?.nom?.[0] || 'O').toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{emp?.nom} {emp?.prenom}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>{emp?.utilisateur?.email || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td>{formatDate(h.date)}</td>
                      <td><Badge variant="warning">{h.heureSupplementaire}h</Badge></td>
                      <td>{h.description || '—'}</td>
                      <td>
                        <div className="table-actions">
                          <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
                            <button className="btn-icon" title="Edit" onClick={() => openEdit(h)}>✏️</button>
                            <button className="btn-icon danger" title="Delete" onClick={() => setDeleteTarget(h.id)}>🗑️</button>
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

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Overtime" message="Remove this overtime record?" loading={deleteLoading} />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add Overtime"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={formLoading}>{formLoading ? 'Saving...' : 'Save'}</button>
        </>}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label form-label-required">Employee</label>
            <select className="form-select" value={form.employeId} onChange={(e) => setForm({ ...form, employeId: e.target.value })} required>
              <option value="">Select employee...</option>
              {employes.map((e) => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-required">Date</label>
              <input type="date" className="form-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label form-label-required">Hours</label>
              <input type="number" min="0" step="0.5" className="form-input" value={form.heureSupplementaire} onChange={(e) => setForm({ ...form, heureSupplementaire: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Overtime"
        footer={<>
          <button className="btn btn-outline" onClick={() => setEditTarget(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleEdit} disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
        </>}>
        <form onSubmit={handleEdit}>
          <div className="form-group">
            <label className="form-label form-label-required">Employee</label>
            <select className="form-select" value={editForm.employeId} onChange={(e) => setEditForm({ ...editForm, employeId: e.target.value })} required>
              <option value="">Select employee...</option>
              {employes.map((e) => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-required">Date</label>
              <input type="date" className="form-input" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label form-label-required">Hours</label>
              <input type="number" min="0" step="0.5" className="form-input" value={editForm.heureSupplementaire} onChange={(e) => setEditForm({ ...editForm, heureSupplementaire: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
