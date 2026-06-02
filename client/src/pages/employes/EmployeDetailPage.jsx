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
  if (!emp) return <div className="crud-loading">Employé non trouvé</div>;

  const statusVariant = emp.status === 'actif' ? 'success' : emp.status === 'inactif' ? 'gray' : 'warning';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Détails de l'employé</h1>
          <p>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>&larr; Retour</button>
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline" onClick={() => navigate(`/employes/${id}/edit`)}>
            ✏️ Modifier
          </button>
        </div>
      </div>

      <div className="detail-header">
        <div className="avatar avatar-lg">
          {(emp.nom?.[0] || 'E').toUpperCase()}
        </div>
        <div className="detail-header-info">
          <div className="detail-header-title">
            {emp.nom} {emp.prenom}
          </div>
          <div className="detail-header-subtitle">
            {emp.utilisateur?.email}
          </div>
        </div>
        <Badge variant={statusVariant}>{emp.status}</Badge>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="card-title" style={{ marginBottom: 20 }}>Informations RH</h3>
        <div className="detail-grid">
          <div className="detail-field">
            <div className="detail-field-label">Poste</div>
            <div className="detail-field-value">{emp.poste || '—'}</div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">Téléphone</div>
            <div className="detail-field-value">{emp.telephone || '—'}</div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">Date d'embauche</div>
            <div className="detail-field-value">{formatDate(emp.dateEmbauche)}</div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">Salaire de base</div>
            <div className="detail-field-value">
              {emp.salaire_base != null ? `${emp.salaire_base.toLocaleString()} DT` : '—'}
            </div>
          </div>
          {emp.salaire_total != null && emp.salaire_total !== emp.salaire_base && (
            <div className="detail-field" style={{ backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '8px 12px' }}>
              <div className="detail-field-label" style={{ color: '#16a34a', fontWeight: '600' }}>Salaire total calculé (Paie)</div>
              <div className="detail-field-value" style={{ color: '#15803d', fontWeight: 'bold' }}>
                {emp.salaire_total.toLocaleString()} DT
              </div>
            </div>
          )}
          <div className="detail-field">
            <div className="detail-field-label">Taux heures sup</div>
            <div className="detail-field-value">
              {emp.prix_heure_sup != null ? `${emp.prix_heure_sup.toLocaleString()} DT/h` : '—'}
            </div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">Créé le</div>
            <div className="detail-field-value">{formatDate(emp.createdAt)}</div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">Mis à jour le</div>
            <div className="detail-field-value">{formatDate(emp.updatedAt)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
