import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { employesAPI } from '../../api/employes.api';
import { useApiToast } from '../../components/common/Toast';
import '../CrudPage.css';

import api from '../../api/client';

const EMPTY_CREATE = {
  nom: '',
  prenom: '',
  email: '',
  password: '',
  poste: '',
  telephone: '',
  dateEmbauche: '',
  salaire_base: '',
  prix_heure_sup: '',
  status: 'actif',
  role: 'employe',
};

const EMPTY_EDIT = {
  nom: '',
  prenom: '',
  poste: '',
  telephone: '',
  dateEmbauche: '',
  salaire_base: '',
  prix_heure_sup: '',
  status: 'actif',
  role: 'employe',
};

export default function EmployeFormPage({ embedded = false, employeId, onSuccess, onCancel } = {}) {
  const params = useParams();
  const id = employeId || params.id;
  const isEdit = !!id;
  const navigate = useNavigate();
  const toast = useApiToast();

  const [form, setForm] = useState(isEdit ? EMPTY_EDIT : EMPTY_CREATE);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [employeeEmail, setEmployeeEmail] = useState('');

  const [postes, setPostes] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadPostes();
    if (isEdit) loadEmploye();
  }, [id]);

  async function loadPostes() {
    try {
      const res = await api.get('/postes');
      setPostes(res.data || []);
    } catch (err) {
      console.error('Failed to load postes', err);
    }
  }

  async function loadEmploye() {
    setFetchLoading(true);
    try {
      const res = await employesAPI.getById(id);
      const d = res.data || {};
      setEmployeeEmail(d.utilisateur?.email || '');
      setForm({
        nom: d.nom || '',
        prenom: d.prenom || '',
        poste: d.poste || '',
        telephone: d.telephone || '',
        dateEmbauche: d.dateEmbauche ? d.dateEmbauche.slice(0, 10) : '',
        salaire_base: d.salaire_base ?? '',
        prix_heure_sup: d.prix_heure_sup ?? '',
        status: d.status || 'actif',
        role: d.utilisateur?.role || 'employe',
      });
    } catch (err) {
      toast.error(err);
    } finally {
      setFetchLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updates = { [name]: value };

    // If position changed, auto-fill salary from the matching poste
    if (name === 'poste') {
      const selectedPoste = postes.find(p => p.nom_poste === value);
      if (selectedPoste) {
        updates.salaire_base = selectedPoste.salaire_base;
        updates.prix_heure_sup = selectedPoste.prix_heure_sup;
      }
    }

    setForm({ ...form, ...updates });
    setErrors({ ...errors, [name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.nom.trim()) newErrors.nom = 'Le nom est obligatoire';
    if (!form.prenom.trim()) newErrors.prenom = 'Le prénom est obligatoire';
    if (!isEdit) {
      if (!form.email.trim()) newErrors.email = 'L\'adresse email est obligatoire';
      if (!form.password || form.password.length < 8)
        newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // Convert numeric fields
      const payload = {
        ...form,
        salaire_base: form.salaire_base !== '' ? parseFloat(form.salaire_base) : 0,
        prix_heure_sup: form.prix_heure_sup !== '' ? parseFloat(form.prix_heure_sup) : 0,
      };

      if (isEdit) {
        // Remove create-only fields from payload
        const { email, password, ...editPayload } = payload;
        await employesAPI.update(id, editPayload);
        toast.success('Mis à jour', 'L\'employé a été mis à jour avec succès.');
      } else {
        await employesAPI.create(payload);
        toast.success('Créé', 'Le compte et le profil de l\'employé ont été créés avec succès.');
      }
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/employes');
      }
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };

  if (fetchLoading) return <div className="crud-loading"><div className="spinner" /></div>;

  return (
    <div>
      {!embedded && (
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Modifier l\'employé' : 'Ajouter un employé'}</h1>
          <p>{isEdit ? 'Mettre à jour les informations de l\'employé.' : 'Créer un nouveau compte et profil d\'employé.'}</p>
        </div>
      </div>

      )}

      <div className={embedded ? undefined : 'card'} style={embedded ? undefined : { maxWidth: 720 }}>
        <form onSubmit={handleSubmit}>

          {/* ── Identity ─────────────────────────────────────────── */}
          <h3 style={{ marginBottom: 16, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Identité
          </h3>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label_required" htmlFor="nom">Nom de famille</label>
              <input
                id="nom"
                name="nom"
                className={`form-input ${errors.nom ? 'form-input-error' : ''}`}
                placeholder="ex. Dupont"
                value={form.nom}
                onChange={handleChange}
              />
              {errors.nom && <span className="form-error">{errors.nom}</span>}
            </div>
            <div className="form-group">
              <label className="form-label form-label_required" htmlFor="prenom">Prénom</label>
              <input
                id="prenom"
                name="prenom"
                className={`form-input ${errors.prenom ? 'form-input-error' : ''}`}
                placeholder="ex. Marie"
                value={form.prenom}
                onChange={handleChange}
              />
              {errors.prenom && <span className="form-error">{errors.prenom}</span>}
            </div>
          </div>

          {/* ── Account (create/edit) ──────────────────────────── */}
          {!isEdit ? (
            <>
              <h3 style={{ marginTop: 24, marginBottom: 16, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Compte de connexion
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label form-label_required" htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                    placeholder="employe@entreprise.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label form-label_required" htmlFor="password">Mot de passe</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      className={`form-input ${errors.password ? 'form-input-error' : ''}`}
                      placeholder="Min. 8 caractères"
                      value={form.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '0 4px'
                      }}
                      title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errors.password && <span className="form-error">{errors.password}</span>}
                  <span className="form-hint">L'employé utilisera ces identifiants pour se connecter.</span>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label" htmlFor="role">Rôle du compte</label>
                <select
                  id="role"
                  name="role"
                  className="form-select"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="employe">Employé</option>
                  <option value="rh">Administrateur RH (RH)</option>
                </select>
                <span className="form-hint">Définit les permissions d'accès au système de cet utilisateur.</span>
              </div>
            </>
          ) : (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email de connexion</label>
                <div className="form-input" style={{ backgroundColor: '#f9fafb', color: '#6b7280' }}>
                  {employeeEmail || 'Loading...'}
                </div>
                <span className="form-hint">Les modifications d'email/mot de passe sont gérées séparément.</span>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="role">Rôle du compte</label>
                <select
                  id="role"
                  name="role"
                  className="form-select"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="employe">Employé</option>
                  <option value="rh">Administrateur RH (RH)</option>
                </select>
                <span className="form-hint">Changer le rôle mettra à jour ses permissions d'accès.</span>
              </div>
            </div>
          )}

          {/* ── HR Info ───────────────────────────────────────── */}
          <h3 style={{ marginTop: 24, marginBottom: 16, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Informations RH
          </h3>

          <div className="form-row">
            <div className="form-group full">
              <label className="form-label" htmlFor="poste">Poste</label>
              <select
                id="poste"
                name="poste"
                className="form-select"
                value={form.poste}
                onChange={handleChange}
              >
                <option value="">Sélectionnez un poste...</option>
                {postes.map((p) => (
                  <option key={p.id || p._id} value={p.nom_poste}>
                    {p.nom_poste}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="telephone">Téléphone</label>
              <input
                id="telephone"
                name="telephone"
                className="form-input"
                placeholder="+213 6xx xxx xxx"
                value={form.telephone}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="dateEmbauche">Date d'embauche</label>
              <input
                id="dateEmbauche"
                name="dateEmbauche"
                type="date"
                className="form-input"
                value={form.dateEmbauche}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* ── Salary ────────────────────────────────────────── */}
          <h3 style={{ marginTop: 24, marginBottom: 16, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Salaire
          </h3>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="salaire_base">Salaire de base (DT)</label>
              <input
                id="salaire_base"
                name="salaire_base"
                type="number"
                className="form-input"
                placeholder="Rempli automatiquement"
                value={form.salaire_base}
                readOnly
                style={{ backgroundColor: 'var(--gray-50)', color: 'var(--gray-500)', cursor: 'not-allowed' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="prix_heure_sup">Taux heures sup (DT/h)</label>
              <input
                id="prix_heure_sup"
                name="prix_heure_sup"
                type="number"
                className="form-input"
                placeholder="Rempli automatiquement"
                value={form.prix_heure_sup}
                readOnly
                style={{ backgroundColor: 'var(--gray-50)', color: 'var(--gray-500)', cursor: 'not-allowed' }}
              />
            </div>
          </div>
          <span className="form-hint" style={{ marginTop: '-10px', display: 'block', marginBottom: '20px' }}>
            Le salaire est défini automatiquement par le poste sélectionné.
          </span>

          <div className="form-group">
            <label className="form-label" htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              className="form-select"
              value={form.status}
              onChange={handleChange}
            >
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
              <option value="en_conge">En congé</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 28 }}>
            <button type="button" className="btn btn-outline" onClick={handleCancel}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading
                ? isEdit ? 'Enregistrement...' : 'Création...'
                : isEdit ? 'Enregistrer' : 'Créer l\'employé'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
