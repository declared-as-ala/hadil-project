import { useState, useEffect, useContext, useRef } from 'react';
import { userAPI } from '../../api/user.api';
import { AuthContext } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../utils/constants';
import './profile.css';

/* ── helpers ──────────────────────────────────────────────── */
function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function getPasswordStrength(pw) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'Faible',   pct: 25,  cls: 'strength-weak'   };
  if (score === 2) return { label: 'Moyen',   pct: 50,  cls: 'strength-fair'   };
  if (score === 3) return { label: 'Bon',   pct: 75,  cls: 'strength-good'   };
  return              { label: 'Fort', pct: 100, cls: 'strength-strong' };
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ── sub-component: FormField ─────────────────────────────── */
function FormField({ id, label, icon, required, optional, error, children }) {
  return (
    <div className="profile-form-group">
      <label htmlFor={id}>
        {label}
        {required && <span className="required">*</span>}
        {optional && (
          <span style={{ fontWeight: 400, color: 'var(--gray-400)', marginLeft: 6, fontSize: '0.78rem' }}>
            (optionnel)
          </span>
        )}
      </label>
      <div className="profile-input-wrapper">
        <span className="input-icon">{icon}</span>
        {children}
      </div>
      {error && (
        <div className="profile-field-error">
          <span>⚠</span> {error}
        </div>
      )}
    </div>
  );
}

/* ── main component ───────────────────────────────────────── */
export default function ProfilePage() {
  const { user: ctxUser, refreshUser } = useContext(AuthContext);

  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('info');
  const [saving, setSaving]     = useState(false);
  const [alert, setAlert]       = useState(null);

  // Info form
  const [fullName, setFullName]     = useState('');
  const [email, setEmail]           = useState('');
  const [matricule, setMatricule]   = useState('');
  const [avatar, setAvatar]         = useState('');
  const [infoErrors, setInfoErrors] = useState({});
  const fileInputRef                = useRef(null);

  // Password form
  const [newPwd, setNewPwd]             = useState('');
  const [confirmPwd, setConfirmPwd]     = useState('');
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [pwdErrors, setPwdErrors]       = useState({});
  const pwdStrength                     = getPasswordStrength(newPwd);

  /* ── load profile ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await userAPI.getMe();
        const u   = res.data?.user || res.data;
        if (!cancelled) {
          setProfile(u);
          setFullName(u.fullName || '');
          setEmail(u.email || '');
          setMatricule(u.matricule || '');
          setAvatar(u.avatar || '');
        }
      } catch (err) {
        if (!cancelled)
          setAlert({ type: 'error', msg: err.message || 'Impossible de charger le profil.' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const clearAlert = () => setAlert(null);

  /* ── validate info ── */
  function validateInfo() {
    const errs = {};
    if (!fullName.trim()) errs.fullName = 'Le nom complet est obligatoire.';
    if (!email.trim())    errs.email    = 'L\'adresse e-mail est obligatoire.';
    else if (!validateEmail(email)) errs.email = 'Entrez une adresse e-mail valide.';
    // Matricule must be exactly 8 digits if provided
    if (matricule.trim() !== '' && !/^\d{8}$/.test(matricule.trim())) {
      errs.matricule = 'L\'ID utilisateur doit comporter exactement 8 chiffres.';
    }
    setInfoErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /* ── validate password ── */
  function validatePassword() {
    const errs = {};
    if (!newPwd) errs.newPwd = 'Le nouveau mot de passe est obligatoire.';
    else if (newPwd.length < 8) errs.newPwd = 'Le mot de passe doit contenir au moins 8 caractères.';
    if (!confirmPwd) errs.confirmPwd = 'Veuillez confirmer votre mot de passe.';
    else if (newPwd !== confirmPwd) errs.confirmPwd = 'Les mots de passe ne correspondent pas.';
    setPwdErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /* ── submit info ── */
  async function handleSaveInfo(e) {
    e.preventDefault();
    clearAlert();
    if (!validateInfo()) return;
    setSaving(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        matricule: matricule.trim(),
        avatar: avatar,
      };
      const res     = await userAPI.updateMe(payload);
      const updated = res.data?.user || res.data;
      setProfile(updated);
      setFullName(updated.fullName || '');
      setEmail(updated.email || '');
      setMatricule(updated.matricule || '');
      setAvatar(updated.avatar || '');
      await refreshUser();
      setAlert({ type: 'success', msg: 'Profil mis à jour avec succès !' });
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Impossible de mettre à jour le profil.' });
    } finally {
      setSaving(false);
    }
  }

  /* ── submit password ── */
  async function handleSavePassword(e) {
    e.preventDefault();
    clearAlert();
    if (!validatePassword()) return;
    setSaving(true);
    try {
      await userAPI.updateMe({ password: newPwd });
      setNewPwd('');
      setConfirmPwd('');
      setAlert({ type: 'success', msg: 'Mot de passe modifié avec succès !' });
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Impossible de modifier le mot de passe.' });
    } finally {
      setSaving(false);
    }
  }

  /* ── switch tab ── */
  function switchTab(t) {
    setTab(t);
    clearAlert();
    setInfoErrors({});
    setPwdErrors({});
  }

  /* ── handle photo upload ── */
  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setAlert({ type: 'error', msg: 'L\'image doit être inférieure à 2 Mo' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
      setAlert({ type: 'success', msg: 'Photo sélectionnée ! Cliquez sur "Enregistrer les modifications" pour mettre à jour.' });
    };
    reader.readAsDataURL(file);
  }

  function handleRemovePhoto() {
    setAvatar('');
    setAlert({ type: 'success', msg: 'Photo supprimée ! Cliquez sur "Enregistrer les modifications" pour confirmer.' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  /* ── loading ── */
  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner" />
        <p>Chargement du profil...</p>
      </div>
    );
  }

  const displayName  = profile?.fullName || ctxUser?.fullName || 'User';
  const displayEmail = profile?.email    || ctxUser?.email    || '';
  const roleLabel    = ROLE_LABELS[profile?.role || ctxUser?.role] || profile?.role || '';

  return (
    <div className="profile-page">
      {/* ── Hero ── */}
      <div className="profile-hero">
        <div className="profile-hero-content">
          <div className="profile-avatar-container">
            <div className="profile-avatar">
              {avatar ? (
                <img src={avatar} alt="Profile" className="profile-avatar-img" />
              ) : (
                getInitials(displayName) || '👤'
              )}
            </div>
            
            {/* Hidden file input */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />

            <div className="profile-avatar-actions">
              <button 
                type="button" 
                className="btn-avatar-edit" 
                onClick={() => fileInputRef.current?.click()}
                title="Télécharger une nouvelle photo"
              >
                📷 Modifier
              </button>
              {avatar && (
                <button 
                  type="button" 
                  className="btn-avatar-remove" 
                  onClick={handleRemovePhoto}
                  title="Supprimer la photo"
                >
                  ❌ Supprimer
                </button>
              )}
            </div>
          </div>

          <div className="profile-hero-info">
            <h1>{displayName}</h1>
            <p>{displayEmail}</p>
            {roleLabel && <span className="profile-role-badge">{roleLabel}</span>}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="profile-layout">
        {/* Left — read-only info */}
        <div className="profile-info-card">
          <div className="profile-info-card-header">
            <h3>Infos du compte</h3>
          </div>
          <div className="profile-info-list">
            <div className="profile-info-item">
              <span className="profile-info-icon">👤</span>
              <div>
                <div className="profile-info-label">Nom complet</div>
                <div className="profile-info-value">{profile?.fullName || '—'}</div>
              </div>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-icon">✉️</span>
              <div>
                <div className="profile-info-label">E-mail</div>
                <div className="profile-info-value">{profile?.email || '—'}</div>
              </div>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-icon">🔑</span>
              <div>
                <div className="profile-info-label">Rôle</div>
                <div className="profile-info-value">{roleLabel || '—'}</div>
              </div>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-icon">🆔</span>
              <div>
                <div className="profile-info-label">ID Utilisateur</div>
                <div
                  className="profile-info-value"
                  style={{ color: profile?.matricule ? 'var(--gray-800)' : 'var(--gray-400)' }}
                >
                  {profile?.matricule || 'Non défini'}
                </div>
              </div>
            </div>

            {profile?.createdAt && (
              <div className="profile-info-item">
                <span className="profile-info-icon">📅</span>
                <div>
                  <div className="profile-info-label">Membre depuis</div>
                  <div className="profile-info-value">
                    {new Date(profile.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — edit card */}
        <div className="profile-form-card">
          <div className="profile-form-tabs">
            <button
              id="tab-info"
              className={`profile-tab-btn${tab === 'info' ? ' active' : ''}`}
              onClick={() => switchTab('info')}
              type="button"
            >
              <span>✏️</span> Modifier le profil
            </button>
            <button
              id="tab-password"
              className={`profile-tab-btn${tab === 'password' ? ' active' : ''}`}
              onClick={() => switchTab('password')}
              type="button"
            >
              <span>🔒</span> Changer le mot de passe
            </button>
          </div>

          <div className="profile-form-body">
            {/* Alert */}
            {alert && (
              <div className={`profile-alert ${alert.type}`} role="alert">
                <span className="profile-alert-icon">
                  {alert.type === 'success' ? '✅' : '❌'}
                </span>
                <span>{alert.msg}</span>
              </div>
            )}

            {/* ── Tab: Info ── */}
            {tab === 'info' && (
              <form id="form-info" onSubmit={handleSaveInfo} noValidate>
                <FormField
                  id="profile-fullName"
                  label="Nom complet"
                  icon="👤"
                  required
                  error={infoErrors.fullName}
                >
                  <input
                    id="profile-fullName"
                    type="text"
                    className={`profile-input${infoErrors.fullName ? ' error' : ''}`}
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setInfoErrors(p => ({ ...p, fullName: '' }));
                    }}
                    placeholder="Votre nom complet"
                    autoComplete="name"
                  />
                </FormField>

                <FormField
                  id="profile-email"
                  label="Adresse e-mail"
                  icon="✉️"
                  required
                  error={infoErrors.email}
                >
                  <input
                    id="profile-email"
                    type="email"
                    className={`profile-input${infoErrors.email ? ' error' : ''}`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setInfoErrors(p => ({ ...p, email: '' }));
                    }}
                    placeholder="votre@email.com"
                    autoComplete="email"
                  />
                </FormField>

                <FormField
                  id="profile-matricule"
                  label="ID Utilisateur"
                  icon="🆔"
                  optional
                  error={infoErrors.matricule}
                >
                  <input
                    id="profile-matricule"
                    type="text"
                    className={`profile-input${infoErrors.matricule ? ' error' : ''}`}
                    value={matricule}
                    onChange={(e) => {
                      // Allow only digits, max 8
                      const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setMatricule(val);
                      setInfoErrors(p => ({ ...p, matricule: '' }));
                    }}
                    placeholder="8 chiffres, ex. 12345678"
                    maxLength={8}
                    inputMode="numeric"
                  />
                </FormField>

                <button
                  id="btn-save-info"
                  type="submit"
                  className="profile-submit-btn"
                  disabled={saving}
                >
                  {saving
                    ? <><span className="btn-spinner" /> Enregistrement…</>
                    : <><span>💾</span> Enregistrer les modifications</>}
                </button>
              </form>
            )}

            {/* ── Tab: Password ── */}
            {tab === 'password' && (
              <form id="form-password" onSubmit={handleSavePassword} noValidate>
                <FormField
                  id="profile-new-pwd"
                  label="Nouveau mot de passe"
                  icon="🔐"
                  required
                  error={pwdErrors.newPwd}
                >
                  <input
                    id="profile-new-pwd"
                    type={showNew ? 'text' : 'password'}
                    className={`profile-input${pwdErrors.newPwd ? ' error' : ''}`}
                    value={newPwd}
                    onChange={(e) => {
                      setNewPwd(e.target.value);
                      setPwdErrors(p => ({ ...p, newPwd: '' }));
                    }}
                    placeholder="Au moins 8 caractères"
                    autoComplete="new-password"
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    className="profile-input-toggle"
                    onClick={() => setShowNew(v => !v)}
                    aria-label={showNew ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showNew ? '🙈' : '👁️'}
                  </button>
                </FormField>

                {newPwd && pwdStrength && (
                  <div className="password-strength">
                    <div className="password-strength-bar">
                      <div
                        className={`password-strength-fill ${pwdStrength.cls}`}
                        style={{ width: `${pwdStrength.pct}%` }}
                      />
                    </div>
                    <span className={`password-strength-label ${pwdStrength.cls}`}>
                      {pwdStrength.label}
                    </span>
                  </div>
                )}

                <div style={{ marginBottom: 'var(--spacing-5)' }} />

                <FormField
                  id="profile-confirm-pwd"
                  label="Confirmer le nouveau mot de passe"
                  icon="🔏"
                  required
                  error={pwdErrors.confirmPwd}
                >
                  <input
                    id="profile-confirm-pwd"
                    type={showConfirm ? 'text' : 'password'}
                    className={`profile-input${pwdErrors.confirmPwd ? ' error' : ''}`}
                    value={confirmPwd}
                    onChange={(e) => {
                      setConfirmPwd(e.target.value);
                      setPwdErrors(p => ({ ...p, confirmPwd: '' }));
                    }}
                    placeholder="Répétez votre nouveau mot de passe"
                    autoComplete="new-password"
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    className="profile-input-toggle"
                    onClick={() => setShowConfirm(v => !v)}
                    aria-label={showConfirm ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </FormField>

                <button
                  id="btn-save-password"
                  type="submit"
                  className="profile-submit-btn"
                  disabled={saving}
                >
                  {saving
                    ? <><span className="btn-spinner" /> Mise à jour…</>
                    : <><span>🔒</span> Modifier le mot de passe</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
