import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { employesAPI } from '../../api/employes.api';
import { useApiToast } from '../../components/common/Toast';
import '../CrudPage.css';

export default function EmployeFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const toast = useApiToast();

  const [form, setForm] = useState({
    utilisateurId: '',
    poste: '',
    departement: '',
    dateEmbauche: '',
    telephone: '',
    status: 'actif',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) loadEmploye();
  }, [id]);

  async function loadEmploye() {
    setFetchLoading(true);
    try {
      const res = await employesAPI.getById(id);
      const d = res.data || {};
      setForm({
        utilisateurId: d.utilisateur?.id || '',
        poste: d.poste || '',
        departement: d.departement || '',
        dateEmbauche: d.dateEmbauche ? d.dateEmbauche.slice(0, 10) : '',
        telephone: d.telephone || '',
        status: d.status || 'actif',
      });
    } catch (err) {
      toast.error(err);
    } finally {
      setFetchLoading(false);
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.utilisateurId) newErrors.utilisateurId = 'User is required';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await employesAPI.update(id, form);
        toast.success('Updated', 'Employee has been updated successfully.');
      } else {
        await employesAPI.create(form);
        toast.success('Created', 'Employee has been created successfully.');
      }
      navigate('/employes');
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <div className="crud-loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit Employee' : 'Add Employee'}</h1>
          <p>{isEdit ? 'Update employee information.' : 'Create a new employee record.'}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 700 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label form-label_required" htmlFor="utilisateurId">
              User ID
            </label>
            <input
              id="utilisateurId"
              name="utilisateurId"
              className={`form-input ${errors.utilisateurId ? 'form-input-error' : ''}`}
              placeholder="Enter the user's MongoDB ID"
              value={form.utilisateurId}
              onChange={handleChange}
            />
            {errors.utilisateurId && <span className="form-error">{errors.utilisateurId}</span>}
            <span className="form-hint">The ID of the User account to link this employee to.</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="poste">Position</label>
              <input
                id="poste"
                name="poste"
                className="form-input"
                placeholder="e.g. Developer"
                value={form.poste}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="departement">Department</label>
              <input
                id="departement"
                name="departement"
                className="form-input"
                placeholder="e.g. IT"
                value={form.departement}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="dateEmbauche">Hire Date</label>
              <input
                id="dateEmbauche"
                name="dateEmbauche"
                type="date"
                className="form-input"
                value={form.dateEmbauche}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="telephone">Phone</label>
              <input
                id="telephone"
                name="telephone"
                className="form-input"
                placeholder="+1234567890"
                value={form.telephone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              className="form-select"
              value={form.status}
              onChange={handleChange}
            >
              <option value="actif">Active</option>
              <option value="inactif">Inactive</option>
              <option value="en_conge">On Leave</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (isEdit ? 'Updating...' : 'Creating...') : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
