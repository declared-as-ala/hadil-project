import { useState, useEffect } from 'react';
import { tachesAPI } from '../../api/taches.api';
import { projetsAPI } from '../../api/projets.api';
import { employesAPI } from '../../api/employes.api';
import { useApiToast } from '../../components/common/Toast';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, formatLabel } from '../../utils/formatters';
import RoleGuard from '../../components/common/RoleGuard';
import { ROLES, TACHE_STATUS, TACHE_PRIORITE } from '../../utils/constants';
import '../CrudPage.css';

const tacheStatusVar = { not_started: 'gray', in_progress: 'info', completed: 'success', blocked: 'danger' };
const tachePrioriteVar = { low: 'gray', medium: 'info', high: 'warning', urgent: 'danger' };

export default function TachesPage() {
  const toast = useApiToast();
  const [data, setData] = useState([]);
  const [projets, setProjets] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ projetId: '', description: '', status: 'not_started', assigneAId: '', priorite: 'medium', dateEcheance: '' });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { loadData(); }, [statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [tRes, pRes, eRes] = await Promise.all([
        tachesAPI.getAll({ status: statusFilter || undefined }),
        projetsAPI.getAll(),
        employesAPI.getAll(),
      ]);
      setData(tRes.data || []);
      setProjets(pRes.data || []);
      setEmployes(eRes.data || []);
    } catch (err) { toast.error(err); }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await tachesAPI.delete(deleteTarget);
      toast.success('Deleted', 'Task removed.');
      setData((p) => p.filter((t) => t.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) { toast.error(err); }
    finally { setDeleteLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormLoading(true);
    try {
      await tachesAPI.create(form);
      toast.success('Created', 'Task added.');
      setShowForm(false);
      setForm({ projetId: '', description: '', status: 'not_started', assigneAId: '', priorite: 'medium', dateEcheance: '' });
      loadData();
    } catch (err) { toast.error(err); }
    finally { setFormLoading(false); }
  }

  const filtered = data.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (t.description || '').toLowerCase().includes(q) || (t.projet?.nom || '').toLowerCase().includes(q);
  });

  if (loading) return <div className="crud-loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1>Tasks</h1><p>Manage project tasks.</p></div>
        <div className="page-header-actions">
          <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Task</button>
          </RoleGuard>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-filters">
            <input type="text" className="form-input" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 220 }} />
            <select className="form-select" style={{ width: 150 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              {Object.values(TACHE_STATUS).map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
            </select>
          </div>
          <span className="table-count">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="✅" title="No tasks" description="No tasks created yet." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Description</th><th>Project</th><th>Assigned To</th><th>Priority</th><th>Status</th><th>Due Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const assignee = t.assigneA?.utilisateur;
                  return (
                    <tr key={t.id}>
                      <td style={{ maxWidth: 250 }}>{t.description}</td>
                      <td><Badge variant="primary">{t.projet?.nom || '—'}</Badge></td>
                      <td>{assignee ? `${assignee.nom} ${assignee.prenom}` : '—'}</td>
                      <td><Badge variant={tachePrioriteVar[t.priorite] || 'gray'}>{formatLabel(t.priorite)}</Badge></td>
                      <td><Badge variant={tacheStatusVar[t.status] || 'gray'}>{formatLabel(t.status)}</Badge></td>
                      <td>{formatDate(t.dateEcheance)}</td>
                      <td>
                        <div className="table-actions">
                          <RoleGuard roles={[ROLES.ADMIN]}>
                            <button className="btn-icon danger" onClick={() => setDeleteTarget(t.id)}>🗑️</button>
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

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Task" message="Remove this task?" loading={deleteLoading} />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Task"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={formLoading}>{formLoading ? 'Creating...' : 'Create'}</button>
        </>}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label form-label-required">Project</label>
            <select className="form-select" value={form.projetId} onChange={(e) => setForm({ ...form, projetId: e.target.value })} required>
              <option value="">Select project...</option>
              {projets.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label form-label-required">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Assigned To</label>
              <select className="form-select" value={form.assigneAId} onChange={(e) => setForm({ ...form, assigneAId: e.target.value })}>
                <option value="">Unassigned</option>
                {employes.map((e) => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priorite} onChange={(e) => setForm({ ...form, priorite: e.target.value })}>
                {Object.values(TACHE_PRIORITE).map((p) => <option key={p} value={p}>{formatLabel(p)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={form.dateEcheance} onChange={(e) => setForm({ ...form, dateEcheance: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.values(TACHE_STATUS).map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
