import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { employesAPI } from '../../api/employes.api';
import { useApiToast } from '../../components/common/Toast';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { formatDate, formatLabel } from '../../utils/formatters';
import RoleGuard from '../../components/common/RoleGuard';
import { ROLES } from '../../utils/constants';
import '../CrudPage.css';

export default function EmployesPage() {
  const { t } = useTranslation();
  const toast = useApiToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewEmp, setViewEmp] = useState(null);

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
          <h1>{t('employes.title')}</h1>
          <p>{t('employes.subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
            <Link to="/employes/new" className="btn btn-primary">{t('employes.add')}</Link>
          </RoleGuard>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-filters">
            <input
              type="text"
              className="form-input"
              placeholder={t('employes.search')}
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
                  <th>{t('employes.columns.employee')}</th>
                  <th>{t('employes.columns.position')}</th>
                  <th>{t('employes.columns.department')}</th>
                  <th>{t('employes.columns.hireDate')}</th>
                  <th>{t('employes.columns.status')}</th>
                  <th>{t('employes.columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => {
                  const statusVariant =
                    emp.status === 'actif' ? 'success' : emp.status === 'inactif' ? 'gray' : 'warning';
                  return (
                    <tr key={emp.id}>
                      <td>
                        <div className="employee-cell">
                          <div className="avatar avatar-sm">
                            {(emp.nom?.[0] || 'E').toUpperCase()}
                          </div>
                          <div>
                            <div className="employee-name">{emp.nom} {emp.prenom}</div>
                            <div className="employee-sub">{emp.utilisateur?.email}</div>
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
                          <button className="btn-icon" title="View" onClick={() => setViewEmp(emp)}>
                            👁️
                          </button>
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
        title={t('employes.delete.title')}
        message={t('employes.delete.message')}
        confirmLabel={t('common.delete')}
        confirmVariant="danger"
        loading={deleteLoading}
      />

      <Modal
        isOpen={!!viewEmp}
        onClose={() => setViewEmp(null)}
        title={t('employes.view.title')}
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setViewEmp(null)}>{t('common.close')}</button>
            <RoleGuard roles={[ROLES.ADMIN, ROLES.RH]}>
              {viewEmp && (
                <Link to={`/employes/${viewEmp.id}/edit`} className="btn btn-primary">
                  ✏️ {t('common.edit')}
                </Link>
              )}
            </RoleGuard>
          </>
        }
      >
        {viewEmp && (
          <>
            <div className="detail-header">
              <div className="avatar avatar-lg" style={{ borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {(viewEmp.nom?.[0] || 'E').toUpperCase()}
              </div>
              <div className="detail-header-info">
                <div className="detail-header-title">{viewEmp.nom} {viewEmp.prenom}</div>
                <div className="detail-header-subtitle">{viewEmp.utilisateur?.email}</div>
              </div>
              <Badge variant={viewEmp.status === 'actif' ? 'success' : viewEmp.status === 'inactif' ? 'gray' : 'warning'}>
                {formatLabel(viewEmp.status)}
              </Badge>
            </div>
            <div className="detail-grid">
              <div className="detail-field">
                <div className="detail-field-label">Position</div>
                <div className="detail-field-value">{viewEmp.poste || '—'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Phone</div>
                <div className="detail-field-value">{viewEmp.telephone || '—'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Hire Date</div>
                <div className="detail-field-value">{formatDate(viewEmp.dateEmbauche)}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Base Salary</div>
                <div className="detail-field-value">
                  {viewEmp.salaire_base != null ? `${Number(viewEmp.salaire_base).toLocaleString()} DA` : '—'}
                </div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Overtime Rate</div>
                <div className="detail-field-value">
                  {viewEmp.prix_heure_sup != null ? `${Number(viewEmp.prix_heure_sup).toLocaleString()} DA/hr` : '—'}
                </div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Created</div>
                <div className="detail-field-value">{formatDate(viewEmp.createdAt)}</div>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
