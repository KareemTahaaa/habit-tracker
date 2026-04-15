import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const EditHabitPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadHabit = async () => {
      try {
        const res = await axiosInstance.get(`/api/habits/${id}`);
        const habit = res.data.habit;

        if (!habit) {
          setServerError('Habit not found.');
          return;
        }

        setForm({
          title: habit.title || '',
          description: habit.description || '',
        });
      } catch (err) {
        setServerError(err.response?.data?.message || 'Failed to load habit.');
      } finally {
        setLoading(false);
      }
    };

    loadHabit();
  }, [id]);

  const validate = () => {
    const nextErrors = {};
    if (!form.title.trim()) {
      nextErrors.title = 'Title is required.';
    }
    return nextErrors;
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

    setSaving(true);
    try {
      await axiosInstance.put(`/api/habits/${id}`, {
        title: form.title.trim(),
        description: form.description.trim(),
      });
      navigate('/habits');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to update habit.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner-lg" />
        <p>Loading habit...</p>
      </div>
    );
  }

  return (
    <div className="habit-form-page">
      <div className="habit-form-card">
        <div className="page-header">
          <p className="section-kicker">Edit</p>
          <h1>Edit Habit</h1>
          <p>Update the habit details without losing progress history.</p>
        </div>

        {serverError && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon">⚠</span>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="edit-habit-title" className="form-label">Title</label>
            <input
              id="edit-habit-title"
              type="text"
              name="title"
              className={`form-input ${errors.title ? 'input-error' : ''}`}
              value={form.title}
              onChange={handleChange}
            />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="edit-habit-description" className="form-label">Description</label>
            <textarea
              id="edit-habit-description"
              name="description"
              className="form-input habit-textarea"
              value={form.description}
              onChange={handleChange}
              rows="5"
            />
          </div>

          <div className="habit-form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/habits')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="btn-spinner" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditHabitPage;