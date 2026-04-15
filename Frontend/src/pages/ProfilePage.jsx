import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'password'

  // Load profile from server on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get('/api/user/profile');
        const { name, email } = res.data.user;
        setForm((prev) => ({ ...prev, name, email }));
      } catch {
        // Token expired — handled by Axios interceptor
      } finally {
        setFetchLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const validateInfo = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required.';
    else if (form.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters.';
    if (!form.email.trim()) newErrors.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = 'Enter a valid email address.';
    return newErrors;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!form.currentPassword) newErrors.currentPassword = 'Current password is required.';
    if (!form.newPassword) newErrors.newPassword = 'New password is required.';
    else if (form.newPassword.length < 8) newErrors.newPassword = 'New password must be at least 8 characters.';
    if (!form.confirmNewPassword) newErrors.confirmNewPassword = 'Please confirm your new password.';
    else if (form.newPassword !== form.confirmNewPassword) newErrors.confirmNewPassword = 'Passwords do not match.';
    return newErrors;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setServerError('');
    setSuccessMessage('');
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateInfo();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.put('/api/user/profile', {
        name: form.name.trim(),
        email: form.email.trim(),
      });
      updateUser(res.data.user);
      setSuccessMessage('Profile updated successfully!');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Update failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validatePassword();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.put('/api/user/profile', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmNewPassword: '' }));
      setSuccessMessage('Password changed successfully!');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Password change failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="page-loading" id="profile-loading">
        <div className="loading-spinner-lg" />
        <p>Loading profile...</p>
      </div>
    );
  }

  const avatarInitial = (form.name || user?.name || 'U').charAt(0).toUpperCase();
  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  return (
    <div className="profile-page" id="profile-page">
      {/* ── Profile Header ─────────────────────────────────────────────────────── */}
      <div className="profile-hero">
        <div className="profile-hero-inner">
          <div className="avatar-container">
            <div className="avatar" id="profile-avatar">{avatarInitial}</div>
            <div className="avatar-ring" />
          </div>
          <div className="profile-meta">
            <h1 className="profile-name" id="profile-display-name">{form.name || user?.name}</h1>
            <p className="profile-email" id="profile-display-email">{form.email || user?.email}</p>
            <span className="profile-joined">Member since {joinedDate}</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────────── */}
      <div className="profile-container">
        <div className="tab-list" role="tablist">
          <button
            role="tab"
            id="tab-info"
            className={`tab-btn ${activeTab === 'info' ? 'tab-active' : ''}`}
            onClick={() => { setActiveTab('info'); setErrors({}); setServerError(''); setSuccessMessage(''); }}
          >
            Account Info
          </button>
          <button
            role="tab"
            id="tab-password"
            className={`tab-btn ${activeTab === 'password' ? 'tab-active' : ''}`}
            onClick={() => { setActiveTab('password'); setErrors({}); setServerError(''); setSuccessMessage(''); }}
          >
            Change Password
          </button>
        </div>

        <div className="profile-card">
          {serverError && (
            <div className="alert alert-error" role="alert" id="profile-error">
              <span className="alert-icon">⚠</span>
              {serverError}
            </div>
          )}
          {successMessage && (
            <div className="alert alert-success" role="status" id="profile-success">
              <span className="alert-icon">✓</span>
              {successMessage}
            </div>
          )}

          {/* ── Info Tab ─────────────────────────────────────────────────────── */}
          {activeTab === 'info' && (
            <form onSubmit={handleInfoSubmit} noValidate id="profile-info-form">
              <div className="form-group">
                <label htmlFor="profile-name" className="form-label">Full Name</label>
                <input
                  id="profile-name"
                  type="text"
                  name="name"
                  className={`form-input ${errors.name ? 'input-error' : ''}`}
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="profile-email" className="form-label">Email Address</label>
                <input
                  id="profile-email"
                  type="email"
                  name="email"
                  className={`form-input ${errors.email ? 'input-error' : ''}`}
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <button id="save-info-btn" type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="btn-spinner" /> : 'Save Changes'}
              </button>
            </form>
          )}

          {/* ── Password Tab ──────────────────────────────────────────────────── */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} noValidate id="profile-password-form">
              <div className="form-group">
                <label htmlFor="current-password" className="form-label">Current Password</label>
                <input
                  id="current-password"
                  type="password"
                  name="currentPassword"
                  className={`form-input ${errors.currentPassword ? 'input-error' : ''}`}
                  placeholder="Your current password"
                  value={form.currentPassword}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                {errors.currentPassword && <span className="field-error">{errors.currentPassword}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="new-password" className="form-label">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  name="newPassword"
                  className={`form-input ${errors.newPassword ? 'input-error' : ''}`}
                  placeholder="At least 8 characters"
                  value={form.newPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                {errors.newPassword && <span className="field-error">{errors.newPassword}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="confirm-new-password" className="form-label">Confirm New Password</label>
                <input
                  id="confirm-new-password"
                  type="password"
                  name="confirmNewPassword"
                  className={`form-input ${errors.confirmNewPassword ? 'input-error' : ''}`}
                  placeholder="Repeat new password"
                  value={form.confirmNewPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                {errors.confirmNewPassword && <span className="field-error">{errors.confirmNewPassword}</span>}
              </div>

              <button id="change-password-btn" type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="btn-spinner" /> : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
