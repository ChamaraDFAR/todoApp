import { useState } from 'react';
import './CreateListModal.css';

function CreateListModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a list name');
      return;
    }
    setLoading(true);
    try {
      await onCreate(trimmed);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create list');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-list-overlay" role="dialog" aria-modal="true" aria-label="New list">
      <div className="create-list-card">
        <div className="create-list-header">
          <h2>New list</h2>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="create-list-form">
          {error && <div className="create-list-error" role="alert">{error}</div>}
          <label className="create-list-label">
            List name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Work, Shopping"
              className="create-list-input"
              autoFocus
            />
          </label>
          <div className="create-list-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create list'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateListModal;
