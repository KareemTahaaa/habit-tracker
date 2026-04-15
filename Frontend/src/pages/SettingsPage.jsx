import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';

const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axiosInstance.get('/api/notifications/settings');
        setSettings(res.data.data);
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to load settings.' });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await axiosInstance.put('/api/notifications/settings', settings);
      setSettings(res.data.data);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePushToggle = async (e) => {
    const enable = e.target.checked;
    
    // Optimistic UI update
    setSettings(prev => ({ ...prev, pushNotificationsEnabled: enable }));

    try {
      if (enable) {
        // Request Permissions
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
          throw new Error('Push notifications are not supported in this browser.');
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Notification permission denied.');
        }

        // Just simulating push subscription for this demo if service worker isn't fully set up yet
        // A real implementation requires VAPID public key and service worker registration
        alert("Push permissions granted! (Service worker would be registered here)");
      } else {
        await axiosInstance.post('/api/notifications/unsubscribe-push');
      }
    } catch (err) {
      alert(err.message);
      // Revert if failed
      setSettings(prev => ({ ...prev, pushNotificationsEnabled: !enable }));
    }
  };

  const handleTestEmail = async () => {
    try {
      await axiosInstance.post('/api/notifications/test-email');
      alert('Test email sent successfully! Please check your inbox.');
    } catch (err) {
      alert('Failed to send test email.');
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner-lg" />
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="profile-hero-inner" style={{ maxWidth: '600px' }}>
          <div>
            <h1 className="profile-name">Notification Settings</h1>
            <p className="profile-email">Customize exactly how and when you want to be reminded.</p>
          </div>
        </div>
      </div>

      <div className="profile-container" style={{ maxWidth: '600px' }}>
        <div className="profile-card">
          {message.text && (
            <div className={`alert alert-${message.type}`}>
              <span className="alert-icon">{message.type === 'success' ? '✓' : '⚠'}</span>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '15px' }}>Channels</h3>
              
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="form-label" style={{ margin: 0, textTransform: 'none', fontSize: '1rem' }}>
                  Email Notifications
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Receive system alerts and updates via email.</p>
                </label>
                <input 
                  type="checkbox" 
                  name="emailNotificationsEnabled" 
                  checked={settings.emailNotificationsEnabled} 
                  onChange={handleChange}
                  style={{ width: '20px', height: '20px' }}
                />
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="form-label" style={{ margin: 0, textTransform: 'none', fontSize: '1rem' }}>
                  Real-time Push Notifications
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Get pop-ups in your browser or device.</p>
                </label>
                <input 
                  type="checkbox" 
                  name="pushNotificationsEnabled" 
                  checked={settings.pushNotificationsEnabled} 
                  onChange={handlePushToggle}
                  style={{ width: '20px', height: '20px' }}
                />
              </div>
            </div>

            <hr style={{ borderColor: 'var(--border-subtle)', margin: '20px 0' }} />

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '15px' }}>Preferences</h3>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="form-label" style={{ margin: 0, textTransform: 'none', fontSize: '1rem' }}>
                  Habit Reminders
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily nudge to complete your habits.</p>
                </label>
                <input 
                  type="checkbox" 
                  name="habitRemindersEnabled" 
                  checked={settings.habitRemindersEnabled} 
                  onChange={handleChange}
                  style={{ width: '20px', height: '20px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reminder Time</label>
                <input 
                  type="time" 
                  name="defaultReminderTime" 
                  className="form-input" 
                  value={settings.defaultReminderTime} 
                  onChange={handleChange}
                  disabled={!settings.habitRemindersEnabled}
                />
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
                <label className="form-label" style={{ margin: 0, textTransform: 'none', fontSize: '1rem' }}>
                  Streak Alerts
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Get warned before losing a streak, or celebrate milestones.</p>
                </label>
                <input 
                  type="checkbox" 
                  name="streakAlertsEnabled" 
                  checked={settings.streakAlertsEnabled} 
                  onChange={handleChange}
                  style={{ width: '20px', height: '20px' }}
                />
              </div>
            </div>

            <hr style={{ borderColor: 'var(--border-subtle)', margin: '20px 0' }} />

            <div style={{ display: 'flex', gap: '15px' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="btn-spinner" /> : 'Save Settings'}
              </button>
              
              <button type="button" className="btn btn-outline" onClick={handleTestEmail}>
                Send Test Email
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
