import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { stagiairesAPI } from '../../api/stagiaires.api';
import { employesAPI } from '../../api/employes.api';
import { useApiToast } from '../../components/common/Toast';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, formatLabel } from '../../utils/formatters';
import RoleGuard from '../../components/common/RoleGuard';
import { ROLES } from '../../utils/constants';
import '../CrudPage.css';

export default function StagiairesPage() {
  const toast = useApiToast();
  const [data, setData] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [encadrantModal, setEncadrantModal] = useState(null);
  const [selectedEncadrant, setSelectedEncadrant] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [stagRes, empRes] = await Promise.all([
        stagiairesAPI.getAll(),
        employesAPI.getAll(),
      ]);
      setData(stagRes.data || []);
      setEmployes(empRes.data || []);
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
      await stagiairesAPI.delete(deleteTarget);
      toast.success('Deleted', 'Intern has been removed.');
      setData((prev) => prev.filter((s) => s.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleAssignEncadrant() {
    if (!encadrantModal || !selectedEncadrant) return;
    try {
      await stagiairesAPI.assignEncadrant(encadrantModal, selectedEncadrant);
      toast.success('Assigned', 'Encadrant has been assigned.');
      setEncadrantModal(null);
      setSelectedEncadrant('');
      loadData();
    } catch (err) {
      toast.error(err);
    }
  }

  const filtered = data.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const nom = (s.utilisateur?.nom || '').toLowerCase();
    const prenom = (s.utilisateur?.prenom || '').toLowerCase();
    return nom.includes(q) || prenom.includes(q) || (s.sujetDeStage || '').toLowerCase().includes(q);
  });

  if (loading) return <div className="crud-loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Interns / Stagiaires</h1>
          <p>Manage interns and their assignments.</p>
        </div>
        <div className="page-header-actions">
          <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
            <Link to="/stagiaires/new" className="btn btn-primary">+ Add Intern</Link>
          </RoleGuard>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-filters">
            <input
              type="text"
              className="form-input"
              placeholder="Search interns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 260 }}
            />
          </div>
          <span className="table-count">{filtered.length} intern{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="🎓" title="No interns yet" description="Add your first intern." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Intern</th>
                  <th>Subject</th>
                  <th>Encadrant</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const u = s.utilisateur || {};
                  const enc = s.encadrant || {};
                  const statusVariant = s.status === 'actif' ? 'success' : s.status === 'termine' ? 'info' : 'gray';
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="avatar avatar-sm">
                            {(u.nom?.[0] || 'S').toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{u.nom} {u.prenom}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ maxWidth: 200 }}>{s.sujetDeStage || '—'}</td>
                      <td>
                        {enc.utilisateur ? `${enc.utilisateur.nom || ''} ${enc.utilisateur.prenom || ''}`.trim() : '—'}
                      </td>
                      <td>
                        <span style={{ fontSize: 'var(--text-xs)' }}>
                          {formatDate(s.dateDebut)} — {formatDate(s.dateFin)}
                        </span>
                      </td>
                      <td><Badge variant={statusVariant}>{formatLabel(s.status)}</Badge></td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-icon"
                            title="Assign Encadrant"
                            onClick={() => { setEncadrantModal(s.id); setSelectedEncadrant(s.encadrant?.id || ''); }}
                          >
                            👤
                          </button>
                          <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
                            <button
                              className="btn-icon danger"
                              title="Delete"
                              onClick={() => setDeleteTarget(s.id)}
                            >
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
        title="Delete Intern"
        message="Are you sure? This cannot be undone."
        loading={deleteLoading}
      />

      <Modal
        isOpen={!!encadrantModal}
        onClose={() => { setEncadrantModal(null); setSelectedEncadrant(''); }}
        title="Assign Encadrant"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => { setEncadrantModal(null); setSelectedEncadrant(''); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAssignEncadrant}>Assign</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Select Encadrant</label>
          <select
            className="form-select"
            value={selectedEncadrant}
            onChange={(e) => setSelectedEncadrant(e.target.value)}
          >
            <option value="">Select an employee...</option>
            {employes.map((e) => (
              <option key={e.id} value={e.id}>
                {e.utilisateur?.nom} {e.utilisateur?.prenom} — {e.poste}
              </option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  );
}
