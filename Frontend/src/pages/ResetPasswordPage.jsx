import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!form.password) newErrors.password = 'Password is required.';
    else if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
    if (!form.confirmPassword) newErrors.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
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

    if (!token) {
      setServerError('Invalid reset link. Please request a new password reset.');
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post('/api/auth/reset-password', {
        token,
        password: form.password,
      });
      // Auto-login after successful reset
      login(res.data.token, res.data.user);
      navigate('/profile');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Password reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card" id="reset-invalid-card">
          <div className="auth-header">
            <div className="auth-icon">❌</div>
            <h1 className="auth-title">Invalid Link</h1>
            <p className="auth-subtitle">This password reset link is invalid or missing.</p>
          </div>
          <Link to="/forgot-password" className="btn btn-primary btn-full" id="request-new-reset-btn">
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card" id="reset-password-card">
        <div className="auth-header">
          <div className="auth-icon">🔑</div>
          <h1 className="auth-title">Set New Password</h1>
          <p className="auth-subtitle">Choose a strong password for your account</p>
        </div>

        {serverError && (
          <div className="alert alert-error" role="alert" id="reset-error">
            <span className="alert-icon">⚠</span>
            {serverError}
            {serverError.includes('expired') && (
              <Link to="/forgot-password" className="alert-link"> Request a new link.</Link>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="reset-password" className="form-label">New Password</label>
            <input
              id="reset-password"
              type="password"
              name="password"
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              placeholder="At least 8 characters"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="reset-confirm-password" className="form-label">Confirm New Password</label>
            <input
              id="reset-confirm-password"
              type="password"
              name="confirmPassword"
              className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
              placeholder="Repeat your new password"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>

          <button id="reset-submit-btn" type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'Reset Password'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login" className="auth-link" id="back-to-login-link">← Back to Sign In</Link>
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

export default ResetPasswordPage;
