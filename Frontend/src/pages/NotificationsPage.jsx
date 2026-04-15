import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    try {
      const res = await axiosInstance.get('/api/notifications');
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await axiosInstance.patch(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(notif => (notif._id === id ? { ...notif, isRead: true } : notif))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axiosInstance.patch('/api/notifications/read-all');
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(notif => notif._id !== id));
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all notifications?')) return;
    try {
      await axiosInstance.delete('/api/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner-lg" />
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="habits-page">
      <div className="habits-hero">
        <div>
          <h1>Notifications</h1>
          <p>Your recent habit reminders and streak alerts.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {unreadCount > 0 && (
            <button className="btn btn-outline" onClick={handleMarkAllAsRead}>
              Mark All Read
            </button>
          )}
          {notifications.length > 0 && (
            <button className="btn btn-danger" onClick={handleClearAll} style={{ backgroundColor: '#dc2626', color: 'white', border: 'none' }}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠</span>
          {error}
        </div>
      )}

      <div className="habit-grid" style={{ gridTemplateColumns: '1fr' }}>
        {notifications.length === 0 ? (
          <div className="empty-state">
            <h2>No Notifications</h2>
            <p>You're fully caught up!</p>
          </div>
        ) : (
          notifications.map(notif => (
            <article 
              key={notif._id} 
              className={`habit-card card ${!notif.isRead ? 'unread-notification' : ''}`}
              style={{ borderLeft: !notif.isRead ? '4px solid var(--color-primary)' : '1px solid var(--border-subtle)' }}
            >
              <div className="habit-card-head">
                <div>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', marginBottom: '5px' }}>
                    {notif.title}
                    {!notif.isRead && <span className="badge badge-today" style={{ fontSize: '0.7rem' }}>New</span>}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>{notif.message}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {!notif.isRead && (
                    <button className="btn btn-sm btn-outline" onClick={() => handleMarkAsRead(notif._id)}>
                      Mark Read
                    </button>
                  )}
                  <button className="btn btn-sm" style={{ border: '1px solid #4a0000', color: '#f87171', background: 'transparent' }} onClick={() => handleDelete(notif._id)}>
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
