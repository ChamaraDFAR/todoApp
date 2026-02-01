import { useState } from 'react';
import { changePassword } from '../api';
import './Profile.css';

function Profile({ user, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
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
      setSuccess('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-overlay" role="dialog" aria-modal="true" aria-label="Profile">
      <div className="profile-card">
        <div className="profile-header">
          <h2>Profile</h2>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <section className="profile-section">
          <h3 className="profile-section-title">Account</h3>
          <p className="profile-email">{user?.email}</p>
        </section>

        <section className="profile-section">
          <h3 className="profile-section-title">Change password</h3>
          <form onSubmit={handleSubmit} className="profile-form">
            {error && (
              <div className="profile-error" role="alert">
                {error}
              </div>
            )}
            {success && (
              <div className="profile-success" role="status">
                {success}
              </div>
            )}
            <label className="profile-label">
              Current password
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="profile-input"
              />
            </label>
            <label className="profile-label">
              New password
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
                className="profile-input"
              />
            </label>
            <label className="profile-label">
              Confirm new password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="profile-input"
              />
            </label>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Profile;
