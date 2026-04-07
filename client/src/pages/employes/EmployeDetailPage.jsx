import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { employesAPI } from '../../api/employes.api';
import { useApiToast } from '../../components/common/Toast';
import { formatDate } from '../../utils/formatters';
import Badge from '../../components/common/Badge';
import '../CrudPage.css';

export default function EmployeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useApiToast();
  const [emp, setEmp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmploye();
  }, [id]);

  async function loadEmploye() {
    setLoading(true);
    try {
      const res = await employesAPI.getById(id);
      setEmp(res.data);
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="crud-loading"><div className="spinner" /></div>;
  if (!emp) return <div className="crud-loading">Employee not found</div>;

  const u = emp.utilisateur || {};
  const statusVariant = emp.status === 'actif' ? 'success' : emp.status === 'inactif' ? 'gray' : 'warning';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Employee Details</h1>
          <p>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>&larr; Back</button>
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline" onClick={() => navigate(`/employes/${id}/edit`)}>
            \u270F\uFE0F Edit
          </button>
        </div>
      </div>

      <div className="detail-header">
        <div className="avatar avatar-lg">
          {(u.nom?.[0] || u.fullName?.[0] || 'E').toUpperCase()}
        </div>
        <div className="detail-header-info">
          <div className="detail-header-title">
            {u.nom || u.fullName} {u.prenom}
          </div>
          <div className="detail-header-subtitle">
            {u.email} {u.adresse && ` &middot; ${u.adresse}`}
          </div>
        </div>
        <Badge variant={statusVariant}>{emp.status}</Badge>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="card-title" style={{ marginBottom: 20 }}>Information</h3>
        <div className="detail-grid">
          <div className="detail-field">
            <div className="detail-field-label">Position</div>
            <div className="detail-field-value">{emp.poste || '—'}</div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">Department</div>
            <div className="detail-field-value">{emp.departement || '—'}</div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">Hire Date</div>
            <div className="detail-field-value">{formatDate(emp.dateEmbauche)}</div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">Phone</div>
            <div className="detail-field-value">{emp.telephone || '—'}</div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">Created</div>
            <div className="detail-field-value">{formatDate(emp.createdAt)}</div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">Last Updated</div>
            <div className="detail-field-value">{formatDate(emp.updatedAt)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
