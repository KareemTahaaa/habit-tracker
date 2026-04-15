import { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [serverMessage, setServerMessage] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setServerError('');

    if (!email.trim()) {
      setEmailError('Email is required.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post('/api/auth/forgot-password', { email: email.trim() });
      setServerMessage(res.data.message || 'Reset link sent! Check your email inbox.');
      setSubmitted(true);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" id="forgot-password-card">
        <div className="auth-header">
          <div className="auth-icon">🔐</div>
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">
            {submitted
              ? 'Check your email for the reset link'
              : 'Enter your email and we\'ll send you a reset link'}
          </p>
        </div>

        {serverError && (
          <div className="alert alert-error" role="alert" id="forgot-error">
            <span className="alert-icon">⚠</span>
            {serverError}
          </div>
        )}

        {submitted ? (
          <div className="success-state" id="forgot-success-state">
            <div className="success-icon">📧</div>
            <p className="success-message">{serverMessage}</p>
            <p className="success-hint">
              Didn&apos;t receive it?{' '}
              <button
                className="text-btn"
                id="resend-email-btn"
                onClick={() => { setSubmitted(false); setServerMessage(''); }}
              >
                Try again
              </button>
            </p>
            <Link to="/login" className="btn btn-outline btn-full" id="back-to-login-btn" style={{ marginTop: '1rem' }}>
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="forgot-email" className="form-label">Email Address</label>
              <input
                id="forgot-email"
                type="email"
                className={`form-input ${emailError ? 'input-error' : ''}`}
                placeholder="john@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                autoComplete="email"
              />
              {emailError && <span className="field-error">{emailError}</span>}
            </div>

            <button id="forgot-submit-btn" type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : 'Send Reset Link'}
            </button>
          </form>
        )}

        {!submitted && (
          <p className="auth-footer">
            <Link to="/login" className="auth-link" id="back-to-login-link">← Back to Sign In</Link>
          </p>
        )}
      </div>

      <div className="auth-decoration" aria-hidden="true">
        <div className="decoration-circle circle-1" />
        <div className="decoration-circle circle-2" />
        <div className="decoration-circle circle-3" />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
