import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contratsAPI } from '../../api/contrats.api';
import { employesAPI } from '../../api/employes.api';
import { useApiToast } from '../../components/common/Toast';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, formatCurrency, formatLabel } from '../../utils/formatters';
import RoleGuard from '../../components/common/RoleGuard';
import { ROLES, CONTRAT_TYPES } from '../../utils/constants';
import '../CrudPage.css';

const contratStatusVar = { actif: 'success', expire: 'gray', resilie: 'danger', en_attente: 'warning' };

export default function ContratsPage() {
  const toast = useApiToast();
  const [data, setData] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [renouvelerModal, setRenouvelerModal] = useState(null);
  const [renouvelerNotes, setRenouvelerNotes] = useState('');
  const [renouvelerLoading, setRenouvelerLoading] = useState(false);
  const [form, setForm] = useState({ employeId: '', type: 'CDI', salaire: '', clausesGeneral: '', posteTravail: '', date_de_debut: '', date_de_fin: '', periode_essai: '' });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { loadData(); }, [typeFilter, statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [cRes, eRes] = await Promise.all([
        contratsAPI.getAll({ type: typeFilter || undefined, status: statusFilter || undefined }),
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
      await contratsAPI.delete(deleteTarget);
      toast.success('Deleted', 'Contract removed.');
      setData((p) => p.filter((c) => c.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) { toast.error(err); }
    finally { setDeleteLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormLoading(true);
    try {
      await contratsAPI.create(form);
      toast.success('Created', 'Contract created.');
      setShowForm(false);
      setForm({ employeId: '', type: 'CDI', salaire: '', clausesGeneral: '', posteTravail: '', date_de_debut: '', date_de_fin: '', periode_essai: '' });
      loadData();
    } catch (err) { toast.error(err); }
    finally { setFormLoading(false); }
  }

  async function handleRenouveler() {
    if (!renouvelerModal) return;
    setRenouvelerLoading(true);
    try {
      await contratsAPI.renouveler(renouvelerModal, renouvelerNotes);
      toast.success('Renewed', 'Contract has been renewed.');
      setRenouvelerModal(null);
      setRenouvelerNotes('');
      loadData();
    } catch (err) { toast.error(err); }
    finally { setRenouvelerLoading(false); }
  }

  const filtered = data.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const emp = c.employe?.utilisateur;
    return `${emp?.nom || ''} ${emp?.prenom || ''}`.toLowerCase().includes(q) || (c.posteTravail || '').toLowerCase().includes(q);
  });

  if (loading) return <div className="crud-loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1>Contracts</h1><p>Manage employee contracts.</p></div>
        <div className="page-header-actions">
          <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Contract</button>
          </RoleGuard>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-filters">
            <input type="text" className="form-input" placeholder="Search contracts..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 220 }} />
            <select className="form-select" style={{ width: 120 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="CIVP">CIVP</option>
            </select>
            <select className="form-select" style={{ width: 140 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="actif">Active</option>
              <option value="expire">Expired</option>
              <option value="resilie">Terminated</option>
            </select>
          </div>
          <span className="table-count">{filtered.length} contract{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="📄" title="No contracts" description="No contracts have been created." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Employee</th><th>Type</th><th>Salary</th><th>Position</th><th>Start Date</th><th>End Date</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const emp = c.employe?.utilisateur;
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar avatar-sm">{(emp?.nom?.[0] || 'C').toUpperCase()}</div>
                          <div><div style={{ fontWeight: 600 }}>{emp?.nom} {emp?.prenom}</div></div>
                        </div>
                      </td>
                      <td><Badge variant={c.type === 'CDI' ? 'success' : c.type === 'CDD' ? 'warning' : 'info'}>{c.type}</Badge></td>
                      <td>{formatCurrency(c.salaire)}</td>
                      <td>{c.posteTravail || '—'}</td>
                      <td>{formatDate(c.date_de_debut)}</td>
                      <td>{c.type === 'CDD' ? formatDate(c.date_de_fin) : <span style={{ color: 'var(--gray-300)' }}>N/A</span>}</td>
                      <td><Badge variant={contratStatusVar[c.status] || 'gray'}>{formatLabel(c.status)}</Badge></td>
                      <td>
                        <div className="table-actions">
                          <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
                            <button className="btn-icon" title="Renew" onClick={() => setRenouvelerModal(c.id)}>🔄</button>
                            <button className="btn-icon danger" title="Delete" onClick={() => setDeleteTarget(c.id)}>🗑️</button>
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

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Contract" message="Remove this contract?" loading={deleteLoading} />

      {/* Create Form */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Contract" size="lg"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={formLoading}>{formLoading ? 'Creating...' : 'Create'}</button>
        </>}>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-required">Employee</label>
              <select className="form-select" value={form.employeId} onChange={(e) => setForm({ ...form, employeId: e.target.value })} required>
                <option value="">Select...</option>
                {employes.map((e) => <option key={e.id} value={e.id}>{e.utilisateur?.nom} {e.utilisateur?.prenom}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label form-label-required">Type</label>
              <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="CIVP">CIVP</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-required">Salary</label>
              <input type="number" min="0" className="form-input" value={form.salaire} onChange={(e) => setForm({ ...form, salaire: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Position</label>
              <input className="form-input" value={form.posteTravail} onChange={(e) => setForm({ ...form, posteTravail: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-required">Start Date</label>
              <input type="date" className="form-input" value={form.date_de_debut} onChange={(e) => setForm({ ...form, date_de_debut: e.target.value })} required />
            </div>
            {form.type === 'CDD' && (
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input type="date" className="form-input" value={form.date_de_fin} onChange={(e) => setForm({ ...form, date_de_fin: e.target.value })} />
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Trial Period (months)</label>
            <input type="number" min="0" className="form-input" value={form.periode_essai} onChange={(e) => setForm({ ...form, periode_essai: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Clauses</label>
            <textarea className="form-textarea" value={form.clausesGeneral} onChange={(e) => setForm({ ...form, clausesGeneral: e.target.value })} />
          </div>
        </form>
      </Modal>

      {/* Renew Modal */}
      <Modal isOpen={!!renouvelerModal} onClose={() => { setRenouvelerModal(null); setRenouvelerNotes(''); }} title="Renew Contract"
        footer={<>
          <button className="btn btn-outline" onClick={() => { setRenouvelerModal(null); setRenouvelerNotes(''); }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleRenouveler} disabled={renouvelerLoading}>{renouvelerLoading ? 'Processing...' : 'Renew'}</button>
        </>}>
        <div className="form-group">
          <label className="form-label">Notes (optional)</label>
          <textarea className="form-textarea" value={renouvelerNotes} onChange={(e) => setRenouvelerNotes(e.target.value)} placeholder="Reason for renewal..." />
        </div>
      </Modal>
    </div>
  );
}
