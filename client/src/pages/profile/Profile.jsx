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
  if (score <= 1) return { label: 'Weak',   pct: 25,  cls: 'strength-weak'   };
  if (score === 2) return { label: 'Fair',   pct: 50,  cls: 'strength-fair'   };
  if (score === 3) return { label: 'Good',   pct: 75,  cls: 'strength-good'   };
  return              { label: 'Strong', pct: 100, cls: 'strength-strong' };
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
            (optional)
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
          setAlert({ type: 'error', msg: err.message || 'Failed to load profile.' });
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
    if (!fullName.trim()) errs.fullName = 'Full name is required.';
    if (!email.trim())    errs.email    = 'Email is required.';
    else if (!validateEmail(email)) errs.email = 'Enter a valid email address.';
    // Matricule must be exactly 8 digits if provided
    if (matricule.trim() !== '' && !/^\d{8}$/.test(matricule.trim())) {
      errs.matricule = 'User ID must be exactly 8 digits (numbers only).';
    }
    setInfoErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /* ── validate password ── */
  function validatePassword() {
    const errs = {};
    if (!newPwd) errs.newPwd = 'New password is required.';
    else if (newPwd.length < 8) errs.newPwd = 'Password must be at least 8 characters.';
    if (!confirmPwd) errs.confirmPwd = 'Please confirm your password.';
    else if (newPwd !== confirmPwd) errs.confirmPwd = 'Passwords do not match.';
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
      setAlert({ type: 'success', msg: 'Profile updated successfully!' });
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to update profile.' });
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
      setAlert({ type: 'success', msg: 'Password changed successfully!' });
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to change password.' });
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
      setAlert({ type: 'error', msg: 'Image must be smaller than 2MB' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
      setAlert({ type: 'success', msg: 'Photo selected! Click "Save Changes" to update.' });
    };
    reader.readAsDataURL(file);
  }

  function handleRemovePhoto() {
    setAvatar('');
    setAlert({ type: 'success', msg: 'Photo removed! Click "Save Changes" to confirm.' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  /* ── loading ── */
  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner" />
        <p>Loading profile…</p>
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
                title="Upload new photo"
              >
                📷 Change
              </button>
              {avatar && (
                <button 
                  type="button" 
                  className="btn-avatar-remove" 
                  onClick={handleRemovePhoto}
                  title="Remove photo"
                >
                  ❌ Remove
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
            <h3>Account Info</h3>
          </div>
          <div className="profile-info-list">
            <div className="profile-info-item">
              <span className="profile-info-icon">👤</span>
              <div>
                <div className="profile-info-label">Full Name</div>
                <div className="profile-info-value">{profile?.fullName || '—'}</div>
              </div>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-icon">✉️</span>
              <div>
                <div className="profile-info-label">Email</div>
                <div className="profile-info-value">{profile?.email || '—'}</div>
              </div>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-icon">🔑</span>
              <div>
                <div className="profile-info-label">Role</div>
                <div className="profile-info-value">{roleLabel || '—'}</div>
              </div>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-icon">🆔</span>
              <div>
                <div className="profile-info-label">User ID</div>
                <div
                  className="profile-info-value"
                  style={{ color: profile?.matricule ? 'var(--gray-800)' : 'var(--gray-400)' }}
                >
                  {profile?.matricule || 'Not Set'}
                </div>
              </div>
            </div>

            {profile?.createdAt && (
              <div className="profile-info-item">
                <span className="profile-info-icon">📅</span>
                <div>
                  <div className="profile-info-label">Member Since</div>
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
              <span>✏️</span> Edit Profile
            </button>
            <button
              id="tab-password"
              className={`profile-tab-btn${tab === 'password' ? ' active' : ''}`}
              onClick={() => switchTab('password')}
              type="button"
            >
              <span>🔒</span> Change Password
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
                  label="Full Name"
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
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                </FormField>

                <FormField
                  id="profile-email"
                  label="Email Address"
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
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                </FormField>

                <FormField
                  id="profile-matricule"
                  label="User ID"
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
                    placeholder="8 digits, e.g. 12345678"
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
                    ? <><span className="btn-spinner" /> Saving…</>
                    : <><span>💾</span> Save Changes</>}
                </button>
              </form>
            )}

            {/* ── Tab: Password ── */}
            {tab === 'password' && (
              <form id="form-password" onSubmit={handleSavePassword} noValidate>
                <FormField
                  id="profile-new-pwd"
                  label="New Password"
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
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    className="profile-input-toggle"
                    onClick={() => setShowNew(v => !v)}
                    aria-label={showNew ? 'Hide password' : 'Show password'}
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
                  label="Confirm New Password"
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
                    placeholder="Repeat your new password"
                    autoComplete="new-password"
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    className="profile-input-toggle"
                    onClick={() => setShowConfirm(v => !v)}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
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
                    ? <><span className="btn-spinner" /> Updating…</>
                    : <><span>🔒</span> Update Password</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
