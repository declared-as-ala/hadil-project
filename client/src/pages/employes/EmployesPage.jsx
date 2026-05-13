import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { employesAPI } from '../../api/employes.api';
import { useApiToast } from '../../components/common/Toast';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, formatLabel } from '../../utils/formatters';
import RoleGuard from '../../components/common/RoleGuard';
import { ROLES } from '../../utils/constants';
import '../CrudPage.css';

export default function EmployesPage() {
  const toast = useApiToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadEmployes();
  }, [statusFilter]);

  async function loadEmployes() {
    setLoading(true);
    try {
      const res = await employesAPI.getAll({ status: statusFilter || undefined });
      setData(res.data || []);
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
      await employesAPI.delete(deleteTarget);
      toast.success('Deleted', 'Employee and their account have been removed.');
      setData((prev) => prev.filter((e) => e.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err);
    } finally {
      setDeleteLoading(false);
    }
  }

  const filtered = data.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const nom = (e.nom || '').toLowerCase();
    const prenom = (e.prenom || '').toLowerCase();
    const email = (e.utilisateur?.email || '').toLowerCase();
    const poste = (e.poste || '').toLowerCase();
    return nom.includes(q) || prenom.includes(q) || email.includes(q) || poste.includes(q);
  });

  if (loading) return <div className="crud-loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Employees</h1>
          <p>Manage your organization's employees.</p>
        </div>
        <div className="page-header-actions">
          <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
            <Link to="/employes/new" className="btn btn-primary">+ Add Employee</Link>
          </RoleGuard>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-filters">
            <input
              type="text"
              className="form-input"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 260 }}
            />
            <select
              className="form-select"
              style={{ width: 160 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="actif">Active</option>
              <option value="inactif">Inactive</option>
              <option value="en_conge">On Leave</option>
            </select>
          </div>
          <span className="table-count">{filtered.length} employee{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="👥"
            title={search ? 'No results found' : 'No employees yet'}
            description={search ? 'Try adjusting your search.' : 'Add your first employee to get started.'}
            action={
              !search && (
                <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
                  <Link to="/employes/new" className="btn btn-primary">+ Add Employee</Link>
                </RoleGuard>
              )
            }
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Hire Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => {
                  const statusVariant =
                    emp.status === 'actif' ? 'success' : emp.status === 'inactif' ? 'gray' : 'warning';
                  return (
                    <tr key={emp.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="avatar avatar-sm">
                            {(emp.nom?.[0] || 'E').toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>
                              {emp.nom} {emp.prenom}
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>
                              {emp.utilisateur?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{emp.poste || '—'}</td>
                      <td>{emp.departement || '—'}</td>
                      <td>{formatDate(emp.dateEmbauche)}</td>
                      <td>
                        <Badge variant={statusVariant}>{formatLabel(emp.status)}</Badge>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/employes/${emp.id}`} className="btn-icon" title="View">
                            👁️
                          </Link>
                          <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
                            <Link to={`/employes/${emp.id}/edit`} className="btn-icon" title="Edit">
                              ✏️
                            </Link>
                            <RoleGuard roles={[ROLES.ADMIN]}>
                              <button
                                className="btn-icon danger"
                                title="Delete"
                                onClick={() => setDeleteTarget(emp.id)}
                              >
                                🗑️
                              </button>
                            </RoleGuard>
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
        title="Delete Employee"
        message="Are you sure you want to delete this employee? Their login account will also be removed. This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
