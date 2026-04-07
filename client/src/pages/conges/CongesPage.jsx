import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { congesAPI } from '../../api/conges.api';
import { employesAPI } from '../../api/employes.api';
import { useApiToast } from '../../components/common/Toast';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, formatDays, formatLabel } from '../../utils/formatters';
import RoleGuard from '../../components/common/RoleGuard';
import { ROLES, CONGE_TYPES, CONGE_STATUS } from '../../utils/constants';
import '../CrudPage.css';

export default function CongesPage() {
  const toast = useApiToast();
  const [data, setData] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [prolongerModal, setProlongerModal] = useState(null);
  const [prolongerDays, setProlongerDays] = useState(1);
  const [prolongerLoading, setProlongerLoading] = useState(false);
  const [form, setForm] = useState({ employeId: '', date_debut: '', periode: '', type_conge: 'annual', motif: '' });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { loadData(); }, [statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [cRes, eRes] = await Promise.all([
        congesAPI.getAll({ status: statusFilter || undefined }),
        employesAPI.getAll(),
      ]);
      setData(cRes.data || []);
      setEmployes(eRes.data || []);
    } catch (err) { toast.error(err); }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await congesAPI.delete(deleteTarget);
      toast.success('Deleted', 'Leave request removed.');
      setData((p) => p.filter((c) => c.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) { toast.error(err); }
    finally { setDeleteLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormLoading(true);
    try {
      await congesAPI.create(form);
      toast.success('Created', 'Leave request submitted.');
      setShowForm(false);
      setForm({ employeId: '', date_debut: '', periode: '', type_conge: 'annual', motif: '' });
      loadData();
    } catch (err) { toast.error(err); }
    finally { setFormLoading(false); }
  }

  async function handleProlonger() {
    if (!prolongerModal) return;
    setProlongerLoading(true);
    try {
      await congesAPI.prolonger(prolongerModal, prolongerDays);
      toast.success('Extended', `Leave extended by ${prolongerDays} day${prolongerDays > 1 ? 's' : ''}.`);
      setProlongerModal(null);
      setProlongerDays(1);
      loadData();
    } catch (err) { toast.error(err); }
    finally { setProlongerLoading(false); }
  }

  const filtered = data.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const emp = c.employe?.utilisateur;
    const name = `${emp?.nom || ''} ${emp?.prenom || ''}`.toLowerCase();
    return name.includes(q) || (c.motif || '').toLowerCase().includes(q);
  });

  if (loading) return <div className="crud-loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Leave Requests</h1>
          <p>Manage employee leave requests and absences.</p>
        </div>
        <div className="page-header-actions">
          <RoleGuard roles={[ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE]}>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Request Leave</button>
          </RoleGuard>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-filters">
            <input type="text" className="form-input" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 220 }} />
            <select className="form-select" style={{ width: 150 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <span className="table-count">{filtered.length} request{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="\uD83C\uDFD6\uFE0F" title="No leave requests" description="All clear!" />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Start Date</th>
                  <th>Duration</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const emp = c.employe?.utilisateur;
                  const sVar = c.status === 'approved' ? 'success' : c.status === 'rejected' ? 'danger' : 'warning';
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar avatar-sm">{(emp?.nom?.[0] || 'C').toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{emp?.nom} {emp?.prenom}</div>
                          </div>
                        </div>
                      </td>
                      <td>{formatDate(c.date_debut)}</td>
                      <td>{formatDays(c.periode)}</td>
                      <td><Badge variant="info">{formatLabel(c.type_conge)}</Badge></td>
                      <td style={{ maxWidth: 180 }}>{c.motif || '—'}</td>
                      <td><Badge variant={sVar}>{formatLabel(c.status)}</Badge></td>
                      <td>
                        <div className="table-actions">
                          <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
                            <button className="btn-icon" title="Extend" onClick={() => setProlongerModal(c.id)}>
                              ➕
                            </button>
                            <button className="btn-icon danger" onClick={() => setDeleteTarget(c.id)}>
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

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Leave Request" message="Remove this leave request?" loading={deleteLoading} />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Request Leave"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={formLoading}>{formLoading ? 'Saving...' : 'Submit'}</button>
        </>}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label form-label-required">Employee</label>
            <select className="form-select" value={form.employeId} onChange={(e) => setForm({ ...form, employeId: e.target.value })} required>
              <option value="">Select employee...</option>
              {employes.map((e) => <option key={e.id} value={e.id}>{e.utilisateur?.nom} {e.utilisateur?.prenom}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-required">Start Date</label>
              <input type="date" className="form-input" value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label form-label-required">Duration (days)</label>
              <input type="number" min="1" className="form-input" value={form.periode} onChange={(e) => setForm({ ...form, periode: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label form-label-required">Type</label>
            <select className="form-select" value={form.type_conge} onChange={(e) => setForm({ ...form, type_conge: e.target.value })} required>
              {Object.entries(CONGE_TYPES).map(([k, v]) => <option key={k} value={v}>{formatLabel(v)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea className="form-textarea" value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })} />
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!prolongerModal} onClose={() => { setProlongerModal(null); setProlongerDays(1); }} title="Extend Leave"
        footer={<>
          <button className="btn btn-outline" onClick={() => { setProlongerModal(null); setProlongerDays(1); }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleProlonger} disabled={prolongerLoading}>{prolongerLoading ? 'Processing...' : 'Extend'}</button>
        </>}>
        <div className="form-group">
          <label className="form-label">Additional Days</label>
          <input type="number" min="1" className="form-input" value={prolongerDays} onChange={(e) => setProlongerDays(Number(e.target.value))} />
        </div>
      </Modal>
    </div>
  );
}
