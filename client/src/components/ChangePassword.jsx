import { useState } from 'react';
import { changePassword } from '../api';
import './ChangePassword.css';

function ChangePassword({ onClose, onSuccess }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-overlay" role="dialog" aria-modal="true" aria-label="Change password">
      <div className="change-password-card">
        <div className="change-password-header">
          <h2>Change password</h2>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="change-password-form">
          {error && (
            <div className="change-password-error" role="alert">
              {error}
            </div>
          )}
          <label className="change-password-label">
            Current password
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="change-password-input"
            />
          </label>
          <label className="change-password-label">
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
              className="change-password-input"
            />
          </label>
          <label className="change-password-label">
            Confirm new password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="change-password-input"
            />
          </label>
          <div className="change-password-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;
