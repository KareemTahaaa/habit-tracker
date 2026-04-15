import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const CreateHabitPage = () => {
  const [form, setForm] = useState({ title: '', description: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

    setLoading(true);
    try {
      await axiosInstance.post('/api/habits', {
        title: form.title.trim(),
        description: form.description.trim(),
      });
      navigate('/habits');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to create habit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="habit-form-page">
      <div className="habit-form-card">
        <div className="page-header">
          <p className="section-kicker">Create</p>
          <h1>New Habit</h1>
          <p>Add a habit to your tracker and start logging completions.</p>
        </div>

        {serverError && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon">⚠</span>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="habit-title" className="form-label">Title</label>
            <input
              id="habit-title"
              type="text"
              name="title"
              className={`form-input ${errors.title ? 'input-error' : ''}`}
              value={form.title}
              onChange={handleChange}
              placeholder="Read for 20 minutes"
            />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="habit-description" className="form-label">Description</label>
            <textarea
              id="habit-description"
              name="description"
              className="form-input habit-textarea"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional notes about the habit"
              rows="5"
            />
          </div>

          <div className="habit-form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/habits')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateHabitPage;