import { useState, useEffect } from 'react';
import { reunionsAPI } from '../../api/reunions.api';
import { projetsAPI } from '../../api/projets.api';
import { employesAPI } from '../../api/employes.api';
import { useApiToast } from '../../components/common/Toast';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatters';
import RoleGuard from '../../components/common/RoleGuard';
import { ROLES } from '../../utils/constants';
import '../CrudPage.css';

export default function ReunionsPage() {
  const toast = useApiToast();
  const [data, setData] = useState([]);
  const [projets, setProjets] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ projetId: '', date_debut: '', date_fin: '', description: '', lieu: '', participantsIds: [], organisateurId: '' });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [rRes, pRes, eRes] = await Promise.all([reunionsAPI.getAll(), projetsAPI.getAll(), employesAPI.getAll()]);
      setData(rRes.data || []);
      setProjets(pRes.data || []);
      setEmployes(eRes.data || []);
    } catch (err) { toast.error(err); }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await reunionsAPI.delete(deleteTarget);
      toast.success('Deleted', 'Meeting removed.');
      setData((p) => p.filter((r) => r.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) { toast.error(err); }
    finally { setDeleteLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormLoading(true);
    try {
      await reunionsAPI.create(form);
      toast.success('Created', 'Meeting scheduled.');
      setShowForm(false);
      setForm({ projetId: '', date_debut: '', date_fin: '', description: '', lieu: '', participantsIds: [], organisateurId: '' });
      loadData();
    } catch (err) { toast.error(err); }
    finally { setFormLoading(false); }
  }

  const filtered = data.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.description || '').toLowerCase().includes(q) || (r.projet?.nom || '').toLowerCase().includes(q) || (r.lieu || '').toLowerCase().includes(q);
  });

  if (loading) return <div className="crud-loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1>Meetings</h1><p>Schedule and manage project meetings.</p></div>
        <div className="page-header-actions">
          <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Schedule Meeting</button>
          </RoleGuard>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <input type="text" className="form-input" placeholder="Search meetings..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 260 }} />
          <span className="table-count">{filtered.length} meeting{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="🧑‍🤝‍🧑" title="No meetings" description="No meetings scheduled." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Project</th><th>Start</th><th>End</th><th>Location</th><th>Participants</th><th>Organizer</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const org = r.organisateur?.utilisateur;
                  return (
                    <tr key={r.id}>
                      <td><span style={{ fontWeight: 600 }}>{r.projet?.nom || '—'}</span></td>
                      <td>{formatDate(r.date_debut)}</td>
                      <td>{formatDate(r.date_fin)}</td>
                      <td>{r.lieu || '—'}</td>
                      <td>{(r.participants || []).length}</td>
                      <td>{org ? `${org.nom} ${org.prenom}` : '—'}</td>
                      <td>
                        <div className="table-actions">
                          <RoleGuard roles={[ROLES.ADMIN]}>
                            <button className="btn-icon danger" onClick={() => setDeleteTarget(r.id)}>🗑️</button>
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

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Meeting" message="Remove this meeting?" loading={deleteLoading} />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Schedule Meeting" size="lg"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={formLoading}>{formLoading ? 'Saving...' : 'Schedule'}</button>
        </>}>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-required">Project</label>
              <select className="form-select" value={form.projetId} onChange={(e) => setForm({ ...form, projetId: e.target.value })} required>
                <option value="">Select project...</option>
                {projets.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Organizer</label>
              <select className="form-select" value={form.organisateurId} onChange={(e) => setForm({ ...form, organisateurId: e.target.value })}>
                <option value="">Select...</option>
                {employes.map((e) => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-required">Start</label>
              <input type="datetime-local" className="form-input" value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label form-label-required">End</label>
              <input type="datetime-local" className="form-input" value={form.date_fin} onChange={(e) => setForm({ ...form, date_fin: e.target.value })} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" value={form.lieu} onChange={(e) => setForm({ ...form, lieu: e.target.value })} placeholder="Room or link" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
