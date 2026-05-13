/* eslint-disable react/prop-types */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/common/Toast';
import './Auth.css';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
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
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back!', 'You have logged in successfully.');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Login failed', err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-shape auth-bg-shape-1" />
        <div className="auth-bg-shape auth-bg-shape-2" />
        <div className="auth-bg-shape auth-bg-shape-3" />
        <div className="auth-bg-grid" />
      </div>

      <div className="auth-layout">
        <div className="auth-form-panel">
          <div className="auth-form-wrapper">

            {/* Branding centered in the card */}
            <div className="auth-card-branding">
              <div className="auth-brand-logo-icon">&#127970;</div>
              <div className="auth-brand-logo-text">HR System</div>
            </div>

            {/* Toggle Tabs */}
            <div className="auth-tabs">
              <Link to="/login" className="auth-tab active">Sign In</Link>
              <Link to="/signup" className="auth-tab">Sign Up</Link>
            </div>

            <div className="auth-form-header">
              <h2 className="auth-form-title">Welcome back</h2>
            </div>

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className={`auth-input-group ${errors.email ? 'auth-input-error' : ''} ${focusedField === 'email' ? 'auth-input-focused' : ''}`}>
                <label className="auth-input-label" htmlFor="email">
                  Email address
                </label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">&#9993;</span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="auth-input"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <span className="auth-field-error">{errors.email}</span>}
              </div>

              <div className={`auth-input-group ${errors.password ? 'auth-input-error' : ''} ${focusedField === 'password' ? 'auth-input-focused' : ''}`}>
                <div className="auth-input-label-row">
                  <label className="auth-input-label" htmlFor="password">
                    Password
                  </label>
                </div>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">&#128274;</span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? '&#128065;' : '&#128064;'}
                  </button>
                </div>
                {errors.password && <span className="auth-field-error">{errors.password}</span>}
              </div>

              <button
                type="submit"
                className={`auth-submit-btn ${loading ? 'auth-submit-loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="auth-submit-spinner" />
                    Signing in&hellip;
                  </>
                ) : (
                  <>
                    Sign in
                    <span className="auth-submit-arrow">&rarr;</span>
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>Protected by enterprise-grade security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
