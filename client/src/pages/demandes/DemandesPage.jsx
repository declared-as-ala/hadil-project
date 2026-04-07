import { useState, useEffect } from 'react';
import { demandesAPI } from '../../api/demandes.api';
import { employesAPI } from '../../api/employes.api';
import { useApiToast } from '../../components/common/Toast';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, formatLabel } from '../../utils/formatters';
import RoleGuard from '../../components/common/RoleGuard';
import { ROLES, DEMANDE_STATUS } from '../../utils/constants';
import '../CrudPage.css';

const statusVariant = {
  pending: 'warning',
  in_progress: 'info',
  accepted: 'success',
  rejected: 'danger',
  resolved: 'success',
};

export default function DemandesPage() {
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
  const [form, setForm] = useState({ sujet: '', description: '', employeId: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => { loadData(); }, [statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [dRes, eRes] = await Promise.all([
        demandesAPI.getAll({ status: statusFilter || undefined }),
        employesAPI.getAll(),
      ]);
      setData(dRes.data || []);
      setEmployes(eRes.data || []);
    } catch (err) { toast.error(err); }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await demandesAPI.delete(deleteTarget);
      toast.success('Deleted', 'Request removed.');
      setData((p) => p.filter((d) => d.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) { toast.error(err); }
    finally { setDeleteLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormLoading(true);
    try {
      await demandesAPI.create(form);
      toast.success('Submitted', 'Your request has been submitted.');
      setShowForm(false);
      setForm({ sujet: '', description: '', employeId: '' });
      loadData();
    } catch (err) { toast.error(err); }
    finally { setFormLoading(false); }
  }

  async function handleUpdateStatus(id) {
    try {
      await demandesAPI.update(id, { status: newStatus, reponse: responseText });
      toast.success('Updated', 'Request status updated.');
      setDetailItem(null);
      setResponseText('');
      setNewStatus('');
      loadData();
    } catch (err) { toast.error(err); }
  }

  const filtered = data.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (d.sujet || '').toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q);
  });

  if (loading) return <div className="crud-loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1>Requests & Claims</h1><p>Manage employee requests and complaints.</p></div>
        <div className="page-header-actions">
          <RoleGuard roles={[ROLES.EMPLOYE, ROLES.STAGIAIRE]}>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Request</button>
          </RoleGuard>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-filters">
            <input type="text" className="form-input" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 220 }} />
            <select className="form-select" style={{ width: 150 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              {Object.values(DEMANDE_STATUS).map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
            </select>
          </div>
          <span className="table-count">{filtered.length} request{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="📩" title="No requests" description="No requests or complaints submitted." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Subject</th><th>Employee</th><th>Status</th><th>Response</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const emp = d.employe?.utilisateur;
                  return (
                    <tr key={d.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{d.sujet}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.description || ''}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar avatar-sm">{(emp?.nom?.[0] || 'D').toUpperCase()}</div>
                          <span>{emp?.nom} {emp?.prenom}</span>
                        </div>
                      </td>
                      <td><Badge variant={statusVariant[d.status] || 'gray'}>{formatLabel(d.status)}</Badge></td>
                      <td style={{ maxWidth: 150 }}>{d.reponse || <span style={{ color: 'var(--gray-300)' }}>—</span>}</td>
                      <td>{formatDate(d.createdAt)}</td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-icon" title="View" onClick={() => { setDetailItem(d); setNewStatus(d.status); setResponseText(d.reponse || ''); }}>👁️</button>
                          <RoleGuard roles={[ROLES.ADMIN]}>
                            <button className="btn-icon danger" onClick={() => setDeleteTarget(d.id)}>🗑️</button>
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

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Request" message="Remove this request?" loading={deleteLoading} />

      {/* New Request Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Request"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={formLoading}>{formLoading ? 'Submitting...' : 'Submit'}</button>
        </>}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label form-label-required">Employee</label>
            <select className="form-select" value={form.employeId} onChange={(e) => setForm({ ...form, employeId: e.target.value })} required>
              <option value="">Select...</option>
              {employes.map((e) => <option key={e.id} value={e.id}>{e.utilisateur?.nom} {e.utilisateur?.prenom}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label form-label-required">Subject</label>
            <input className="form-input" value={form.sujet} onChange={(e) => setForm({ ...form, sujet: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </form>
      </Modal>

      {/* Detail / Update Modal */}
      {detailItem && (
        <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title="Request Details" size="lg"
          footer={<>
            <button className="btn btn-outline" onClick={() => setDetailItem(null)}>Close</button>
            <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
              <button className="btn btn-primary" onClick={() => handleUpdateStatus(detailItem.id)}>Update</button>
            </RoleGuard>
          </>}>
          <div className="detail-grid" style={{ marginBottom: 24 }}>
            <div className="detail-field">
              <div className="detail-field-label">Subject</div>
              <div className="detail-field-value">{detailItem.sujet}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">Status</div>
              <div className="detail-field-value"><Badge variant={statusVariant[detailItem.status] || 'gray'}>{formatLabel(detailItem.status)}</Badge></div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">Employee</div>
              <div className="detail-field-value">{detailItem.employe?.utilisateur?.nom} {detailItem.employe?.utilisateur?.prenom}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">Created</div>
              <div className="detail-field-value">{formatDate(detailItem.createdAt)}</div>
            </div>
          </div>
          {detailItem.description && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Description</div>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--text-sm)' }}>{detailItem.description}</p>
            </div>
          )}
          <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
              <h4 style={{ marginBottom: 12 }}>Update Request</h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    {Object.values(DEMANDE_STATUS).map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Response</label>
                  <input className="form-input" value={responseText} onChange={(e) => setResponseText(e.target.value)} />
                </div>
              </div>
            </div>
          </RoleGuard>
        </Modal>
      )}
    </div>
  );
}
