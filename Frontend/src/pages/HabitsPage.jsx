import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const HabitsPage = () => {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');
  const [actionError, setActionError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadHabits = async () => {
      try {
        const res = await axiosInstance.get('/api/habits');
        setHabits(res.data.habits || []);
      } catch (err) {
        setServerError(err.response?.data?.message || 'Failed to load habits.');
      } finally {
        setLoading(false);
      }
    };

    loadHabits();
  }, []);

  const handleDelete = async (habitId) => {
    if (!window.confirm('Delete this habit?')) {
      return;
    }

    setActionError('');
    try {
      await axiosInstance.delete(`/api/habits/${habitId}`);
      setHabits((prev) => prev.filter((habit) => habit._id !== habitId));
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete habit.');
    }
  };

  const handleComplete = async (habitId) => {
    setActionError('');
    try {
      const res = await axiosInstance.post(`/api/habits/${habitId}/complete`);
      setHabits((prev) => prev.map((habit) => (habit._id === habitId ? res.data.habit : habit)));
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to mark habit complete.');
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner-lg" />
        <p>Loading habits...</p>
      </div>
    );
  }

  return (
    <div className="habits-page">
      <div className="habits-hero">
        <div>
          <h1>Habit Management</h1>
          <p>Track, update, and complete your habits from one place.</p>
        </div>
        <Link to="/habits/new" className="btn btn-primary">
          New Habit
        </Link>
      </div>

      {serverError && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon">⚠</span>
          {serverError}
        </div>
      )}

      {actionError && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon">⚠</span>
          {actionError}
        </div>
      )}

      <div className="habit-grid">
        {habits.length === 0 ? (
          <div className="empty-state">
            <h2>No habits yet</h2>
            <p>Create your first habit to start tracking progress.</p>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/habits/new')}>
              Create Habit
            </button>
          </div>
        ) : (
          habits.map((habit) => {
            const completedDates = habit.completedDates || [];
            const today = new Date().toDateString();

            return (
              <article className="habit-card card" key={habit._id}>
                <div className="habit-card-head">
                  <div>
                    <h2>{habit.title}</h2>
                    <p>{habit.description || 'No description provided.'}</p>
                  </div>
                </div>

                <div className="habit-stats-row">
                  <span className="habit-stat-text">Completed: {completedDates.length}</span>
                  <span className="habit-streak-pill">🔥 {habit.currentStreak || 0} day streak</span>
                </div>

                <div className="habit-actions">
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => handleComplete(habit._id)}>
                    Complete
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(`/habits/edit/${habit._id}`)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(habit._id)}>
                    Delete
                  </button>
                </div>

                <div className="habit-history">
                  <p className="habit-history-label">History</p>
                  <div className="habit-history-list">
                    {completedDates.length === 0 && <p className="habit-history-empty">No completions yet</p>}
                    {completedDates.slice(-5).map((date, index) => {
                      const isToday = new Date(date).toDateString() === today;
                      return (
                        <span key={`${habit._id}-${index}`} className={`badge ${isToday ? 'badge-today' : ''}`}>
                          {new Date(date).toLocaleDateString()}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HabitsPage;