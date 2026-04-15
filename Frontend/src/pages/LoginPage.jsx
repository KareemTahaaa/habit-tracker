import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to intended page or habits after login
  const from = location.state?.from?.pathname || '/habits';

  const validate = () => {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = 'Enter a valid email address.';
    if (!form.password) newErrors.password = 'Password is required.';
    return newErrors;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post('/api/auth/login', {
        email: form.email.trim(),
        password: form.password,
      });
      login(res.data.token, res.data.user);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" id="login-card">
        <div className="auth-header">
          <div className="auth-icon">✦</div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        {serverError && (
          <div className="alert alert-error" role="alert" id="login-error">
            <span className="alert-icon">⚠</span>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Email Address</label>
            <input
              id="login-email"
              type="email"
              name="email"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              placeholder="john@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">
              Password
              <Link to="/forgot-password" className="form-label-link" id="forgot-password-link" tabIndex={-1}>
                Forgot password?
              </Link>
            </label>
            <input
              id="login-password"
              type="password"
              name="password"
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              placeholder="Your password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <button id="login-submit-btn" type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="auth-link" id="register-redirect-link">Create one</Link>
        </p>
      </div>

      <div className="auth-decoration" aria-hidden="true">
        <div className="decoration-circle circle-1" />
        <div className="decoration-circle circle-2" />
        <div className="decoration-circle circle-3" />
      </div>
    </div>
  );
};

export default LoginPage;
