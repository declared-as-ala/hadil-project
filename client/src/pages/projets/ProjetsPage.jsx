import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projetsAPI } from '../../api/projets.api';
import { employesAPI } from '../../api/employes.api';
import { useApiToast } from '../../components/common/Toast';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, formatLabel } from '../../utils/formatters';
import RoleGuard from '../../components/common/RoleGuard';
import { ROLES, PROJET_STATUS } from '../../utils/constants';
import '../CrudPage.css';

const projStatusVar = {
  not_started: 'gray',
  in_progress: 'info',
  completed: 'success',
  on_hold: 'warning',
  cancelled: 'danger',
};

export default function ProjetsPage() {
  const toast = useApiToast();
  const [data, setData] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [form, setForm] = useState({ nom: '', description: '', status: 'not_started', dateDebut: '', dateFin: '', chefDeProjetId: '', membresIds: [] });
  const [formLoading, setFormLoading] = useState(false);
  const [assignEmp, setAssignEmp] = useState('');
  const [assignModal, setAssignModal] = useState(null);

  useEffect(() => { loadData(); }, [statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [pRes, eRes] = await Promise.all([projetsAPI.getAll({ status: statusFilter || undefined }), employesAPI.getAll()]);
      setData(pRes.data || []);
      setEmployes(eRes.data || []);
    } catch (err) { toast.error(err); }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await projetsAPI.delete(deleteTarget);
      toast.success('Deleted', 'Project removed.');
      setData((p) => p.filter((x) => x.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) { toast.error(err); }
    finally { setDeleteLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = { ...form };
      if (!form.chefDeProjetId) delete payload.chefDeProjetId;
      if (form.membresIds.length === 0) delete payload.membresIds;
      await projetsAPI.create(payload);
      toast.success('Created', 'Project created.');
      setShowForm(false);
      setForm({ nom: '', description: '', status: 'not_started', dateDebut: '', dateFin: '', chefDeProjetId: '', membresIds: [] });
      loadData();
    } catch (err) { toast.error(err); }
    finally { setFormLoading(false); }
  }

  async function handleAssign() {
    if (!assignModal || !assignEmp) return;
    try {
      await projetsAPI.assignMember(assignModal, assignEmp);
      toast.success('Assigned', 'Member added to project.');
      setAssignModal(null);
      setAssignEmp('');
      loadData();
    } catch (err) { toast.error(err); }
  }

  const filtered = data.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (p.nom || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
  });

  if (loading) return <div className="crud-loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1>Projects</h1><p>Manage company projects and teams.</p></div>
        <div className="page-header-actions">
          <RoleGuard roles={[ROLES.ADMIN]}>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Project</button>
          </RoleGuard>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-filters">
            <input type="text" className="form-input" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 240 }} />
            <select className="form-select" style={{ width: 160 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              {Object.values(PROJET_STATUS).map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
            </select>
          </div>
          <span className="table-count">{filtered.length} project{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="🚀" title="No projects" description="Create your first project." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Project</th><th>Status</th><th>Lead</th><th>Team</th><th>Period</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const chef = p.chefDeProjet;
                  return (
                    <tr key={p.id}>
                      <td>
                        <Link to={`/projets/${p.id}`} style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{p.nom}</Link>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>
                      </td>
                      <td><Badge variant={projStatusVar[p.status] || 'gray'}>{formatLabel(p.status)}</Badge></td>
                      <td>{chef ? `${chef.nom} ${chef.prenom}` : '—'}</td>
                      <td><Badge variant="purple">{(p.membres || []).length}</Badge></td>
                      <td style={{ fontSize: 'var(--text-xs)' }}>{formatDate(p.dateDebut)} — {formatDate(p.dateFin)}</td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-icon" title="View" onClick={() => setDetailItem(p)}>👁️</button>
                          <RoleGuard roles={[ROLES.ADMIN]}>
                            <button className="btn-icon" title="Add Member" onClick={() => setAssignModal(p.id)}>👤+</button>
                            <button className="btn-icon danger" onClick={() => setDeleteTarget(p.id)}>🗑️</button>
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

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Project" message="Remove this project?" loading={deleteLoading} />

      {/* Create Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Project"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={formLoading}>{formLoading ? 'Creating...' : 'Create'}</button>
        </>}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label form-label-required">Name</label>
            <input className="form-input" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-input" value={form.dateDebut} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input type="date" className="form-input" value={form.dateFin} onChange={(e) => setForm({ ...form, dateFin: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Project Lead</label>
            <select className="form-select" value={form.chefDeProjetId} onChange={(e) => setForm({ ...form, chefDeProjetId: e.target.value })}>
              <option value="">None</option>
              {employes.map((e) => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
            </select>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {detailItem && (
        <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title="Project Details" size="lg">
          <div className="detail-grid" style={{ marginBottom: 20 }}>
            <div className="detail-field">
              <div className="detail-field-label">Name</div>
              <div className="detail-field-value">{detailItem.nom}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">Status</div>
              <div className="detail-field-value"><Badge variant={projStatusVar[detailItem.status] || 'gray'}>{formatLabel(detailItem.status)}</Badge></div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">Lead</div>
              <div className="detail-field-value">{detailItem.chefDeProjet?.nom} {detailItem.chefDeProjet?.prenom}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">Team Size</div>
              <div className="detail-field-value">{(detailItem.membres || []).length} members</div>
            </div>
          </div>
          {detailItem.description && <p style={{ color: 'var(--gray-600)', fontSize: 'var(--text-sm)', marginBottom: 16 }}>{detailItem.description}</p>}
          {(detailItem.membres || []).length > 0 && (
            <div>
              <h4 style={{ marginBottom: 8 }}>Team Members</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {detailItem.membres.map((m) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--gray-50)', borderRadius: 'var(--border-radius)', fontSize: 'var(--text-sm)' }}>
                    <div className="avatar avatar-sm" style={{ width: 28, height: 28, fontSize: 'var(--text-xs)' }}>
                      {(m.nom?.[0] || 'M').toUpperCase()}
                    </div>
                    {m.nom} {m.prenom}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Assign Modal */}
      <Modal isOpen={!!assignModal} onClose={() => { setAssignModal(null); setAssignEmp(''); }} title="Add Team Member"
        footer={<>
          <button className="btn btn-outline" onClick={() => { setAssignModal(null); setAssignEmp(''); }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAssign}>Assign</button>
        </>}>
        <select className="form-select" value={assignEmp} onChange={(e) => setAssignEmp(e.target.value)}>
          <option value="">Select employee...</option>
          {employes.map((e) => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
        </select>
      </Modal>
    </div>
  );
}
