import { useState } from 'react';
import { changePassword } from '../api';
import './Profile.css';

function Profile({ user, onBack }) {
  const [activeOption, setActiveOption] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async (e) => {
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
    <div className="profile-page">
      <div className="profile-page-header">
        <button type="button" className="btn btn-ghost profile-back" onClick={onBack}>
          ← Back to Todo list
        </button>
        <h1 className="profile-page-title">Profile</h1>
      </div>

      <div className="profile-page-content">
        <section className="profile-block">
          <h2 className="profile-block-title">Account</h2>
          <p className="profile-email">{user?.email}</p>
        </section>

        <section className="profile-block">
          <h2 className="profile-block-title">Settings</h2>
          <ul className="profile-options">
            <li className="profile-option">
              <button
                type="button"
                className={`profile-option-btn ${activeOption === 'password' ? 'active' : ''}`}
                onClick={() => setActiveOption(activeOption === 'password' ? null : 'password')}
              >
                <span className="profile-option-label">Password reset</span>
                <span className="profile-option-arrow">{activeOption === 'password' ? '▼' : '▶'}</span>
              </button>
              {activeOption === 'password' && (
                <div className="profile-option-content">
                  <form onSubmit={handlePasswordSubmit} className="profile-form">
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
                </div>
              )}
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default Profile;
