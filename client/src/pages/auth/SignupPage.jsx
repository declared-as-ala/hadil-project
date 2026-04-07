import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/common/Toast';
import './Auth.css';

export default function SignupPage() {
  const { signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    adresse: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.nom.trim()) newErrors.nom = 'Last name is required';
    if (!formData.prenom.trim()) newErrors.prenom = 'First name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email address';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'At least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await signup({
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        adresse: formData.adresse,
        password: formData.password,
      });
      toast.success('Account created!', 'Your account has been created successfully.');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Signup failed', err.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Animated background */}
      <div className="auth-bg">
        <div className="auth-bg-shape auth-bg-shape-1" />
        <div className="auth-bg-shape auth-bg-shape-2" />
        <div className="auth-bg-shape auth-bg-shape-3" />
        <div className="auth-bg-grid" />
      </div>

      <div className="auth-layout">
        {/* Left panel — branding */}
        <div className="auth-brand-panel">
          <div className="auth-brand-content">
            <div className="auth-brand-logo">
              <span className="auth-brand-logo-icon">&#127970;</span>
              <span className="auth-brand-logo-text">HR System</span>
            </div>

            <div className="auth-brand-main">
              <h1 className="auth-brand-title">
                Start Managing
                <br />
                <span className="auth-brand-title-accent">Your Team</span>
              </h1>
              <p className="auth-brand-description">
                Create your account and get access to powerful HR tools designed to
                make workforce management effortless.
              </p>

              <div className="auth-brand-features">
                <div className="auth-feature">
                  <span className="auth-feature-icon">&#128101;</span>
                  <div>
                    <strong>Team Directory</strong>
                    <span>Centralized employee profiles</span>
                  </div>
                </div>
                <div className="auth-feature">
                  <span className="auth-feature-icon">&#128202;</span>
                  <div>
                    <strong>Analytics Dashboard</strong>
                    <span>Real-time HR metrics &amp; insights</span>
                  </div>
                </div>
                <div className="auth-feature">
                  <span className="auth-feature-icon">&#128276;</span>
                  <div>
                    <strong>Smart Notifications</strong>
                    <span>Never miss a request or deadline</span>
                  </div>
                </div>
                <div className="auth-feature">
                  <span className="auth-feature-icon">&#128737;</span>
                  <div>
                    <strong>Role-Based Access</strong>
                    <span>Secure permissions for every level</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-brand-footer">
            <span>&#169; 2025 HR Management System</span>
          </div>
        </div>

        {/* Right panel — signup form */}
        <div className="auth-form-panel">
          <div className="auth-form-wrapper">
            <div className="auth-form-header">
              <span className="auth-form-greeting">&#127775;</span>
              <h2 className="auth-form-title">Create your account</h2>
              <p className="auth-form-subtitle">Fill in your details to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="auth-form-row">
                <div className={`auth-input-group ${errors.nom ? 'auth-input-error' : ''} ${focusedField === 'nom' ? 'auth-input-focused' : ''}`}>
                  <label className="auth-input-label" htmlFor="nom">Last name</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">&#128100;</span>
                    <input id="nom" name="nom" type="text" className="auth-input" placeholder="Dupont" value={formData.nom} onChange={handleChange} onFocus={() => setFocusedField('nom')} onBlur={() => setFocusedField(null)} />
                  </div>
                  {errors.nom && <span className="auth-field-error">{errors.nom}</span>}
                </div>

                <div className={`auth-input-group ${errors.prenom ? 'auth-input-error' : ''} ${focusedField === 'prenom' ? 'auth-input-focused' : ''}`}>
                  <label className="auth-input-label" htmlFor="prenom">First name</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">&#128100;</span>
                    <input id="prenom" name="prenom" type="text" className="auth-input" placeholder="Jean" value={formData.prenom} onChange={handleChange} onFocus={() => setFocusedField('prenom')} onBlur={() => setFocusedField(null)} />
                  </div>
                  {errors.prenom && <span className="auth-field-error">{errors.prenom}</span>}
                </div>
              </div>

              <div className={`auth-input-group ${errors.email ? 'auth-input-error' : ''} ${focusedField === 'email' ? 'auth-input-focused' : ''}`}>
                <label className="auth-input-label" htmlFor="email">Email address</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">&#9993;</span>
                  <input id="email" name="email" type="email" className="auth-input" placeholder="you@company.com" value={formData.email} onChange={handleChange} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} autoComplete="email" />
                </div>
                {errors.email && <span className="auth-field-error">{errors.email}</span>}
              </div>

              <div className={`auth-input-group ${focusedField === 'adresse' ? 'auth-input-focused' : ''}`}>
                <label className="auth-input-label" htmlFor="adresse">
                  Address <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>(optional)</span>
                </label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">&#127968;</span>
                  <input id="adresse" name="adresse" type="text" className="auth-input" placeholder="123 Main Street" value={formData.adresse} onChange={handleChange} onFocus={() => setFocusedField('adresse')} onBlur={() => setFocusedField(null)} />
                </div>
              </div>

              <div className="auth-form-row">
                <div className={`auth-input-group ${errors.password ? 'auth-input-error' : ''} ${focusedField === 'password' ? 'auth-input-focused' : ''}`}>
                  <label className="auth-input-label" htmlFor="password">Password</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">&#128274;</span>
                    <input id="password" name="password" type={showPassword ? 'text' : 'password'} className="auth-input" placeholder="Min. 8 chars" value={formData.password} onChange={handleChange} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} autoComplete="new-password" />
                    <button type="button" className="auth-password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>{showPassword ? '&#128065;' : '&#128064;'}</button>
                  </div>
                  {errors.password && <span className="auth-field-error">{errors.password}</span>}
                </div>

                <div className={`auth-input-group ${errors.confirmPassword ? 'auth-input-error' : ''} ${focusedField === 'confirmPassword' ? 'auth-input-focused' : ''}`}>
                  <label className="auth-input-label" htmlFor="confirmPassword">Confirm</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">&#128274;</span>
                    <input id="confirmPassword" name="confirmPassword" type={showPassword ? 'text' : 'password'} className="auth-input" placeholder="Repeat password" value={formData.confirmPassword} onChange={handleChange} onFocus={() => setFocusedField('confirmPassword')} onBlur={() => setFocusedField(null)} autoComplete="new-password" />
                  </div>
                  {errors.confirmPassword && <span className="auth-field-error">{errors.confirmPassword}</span>}
                </div>
              </div>

              <button type="submit" className={`auth-submit-btn ${loading ? 'auth-submit-loading' : ''}`} disabled={loading}>
                {loading ? (
                  <><span className="auth-submit-spinner" /> Creating account&hellip;</>
                ) : (
                  <>Create account <span className="auth-submit-arrow">&rarr;</span></>
                )}
              </button>
            </form>

            <div className="auth-form-footer">
              <span>Already have an account?</span>
              <Link to="/login" className="auth-form-link">
                Sign in <span>&rarr;</span>
              </Link>
            </div>

            <div className="auth-divider">
              <span>Protected by enterprise-grade security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
