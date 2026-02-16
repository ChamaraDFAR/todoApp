import { useState, useEffect, useRef } from 'react';
import { changePassword, getProfile, updateProfile, uploadAvatar, deleteAvatar } from '../api';
import './Profile.css';

const API_BASE = import.meta.env.DEV ? 'http://localhost:5001' : '';

function Profile({ user, onBack, onUserUpdate }) {
  const [activeOption, setActiveOption] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Profile form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Avatar state
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const fileInputRef = useRef(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // Load profile on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getProfile();
        setProfile(data);
        setName(data.name || '');
        setEmail(data.email || '');
      } catch (err) {
        setProfileError(err.message || 'Failed to load profile');
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!email.trim()) {
      setProfileError('Email is required');
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await updateProfile({ name: name.trim() || null, email: email.trim() });
      setProfile(updated);
      setProfileSuccess('Profile updated.');
      if (onUserUpdate) {
        onUserUpdate(updated);
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowed = /\.(png|jpg|jpeg|gif)$/i;
    if (!allowed.test(file.name)) {
      setAvatarError('Only PNG, JPG, JPEG, and GIF images are allowed');
      return;
    }

    setAvatarError(null);
    setAvatarLoading(true);
    try {
      const updated = await uploadAvatar(file);
      setProfile(updated);
      if (onUserUpdate) {
        onUserUpdate(updated);
      }
    } catch (err) {
      setAvatarError(err.message || 'Failed to upload avatar');
    } finally {
      setAvatarLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAvatarRemove = async () => {
    if (!profile?.avatar) return;

    setAvatarError(null);
    setAvatarLoading(true);
    try {
      const updated = await deleteAvatar();
      setProfile(updated);
      if (onUserUpdate) {
        onUserUpdate(updated);
      }
    } catch (err) {
      setAvatarError(err.message || 'Failed to remove avatar');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Something went wrong');
    } finally {
      setSavingPassword(false);
    }
  };

  const getAvatarUrl = () => {
    if (profile?.avatar) {
      return `${API_BASE}/uploads/${profile.avatar}`;
    }
    return null;
  };

  const getInitials = () => {
    if (profile?.name) {
      return profile.name.charAt(0).toUpperCase();
    }
    if (profile?.email) {
      return profile.email.charAt(0).toUpperCase();
    }
    return '?';
  };

  if (loadingProfile) {
    return (
      <div className="profile-page">
        <div className="profile-page-header">
          <button type="button" className="btn btn-ghost profile-back" onClick={onBack}>
            ← Back to Todo list
          </button>
          <h1 className="profile-page-title">Profile</h1>
        </div>
        <div className="profile-loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <button type="button" className="btn btn-ghost profile-back" onClick={onBack}>
          ← Back to Todo list
        </button>
        <h1 className="profile-page-title">Profile</h1>
      </div>

      <div className="profile-page-content">
        {/* Avatar Section */}
        <section className="profile-block profile-avatar-section">
          <div className="profile-avatar-container">
            <div 
              className={`profile-avatar ${avatarLoading ? 'loading' : ''}`}
              onClick={handleAvatarClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleAvatarClick()}
            >
              {getAvatarUrl() ? (
                <img src={getAvatarUrl()} alt="Profile" className="profile-avatar-img" />
              ) : (
                <span className="profile-avatar-initials">{getInitials()}</span>
              )}
              <div className="profile-avatar-overlay">
                <span>{avatarLoading ? 'Uploading...' : 'Change'}</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif"
              onChange={handleAvatarChange}
              className="profile-avatar-input"
            />
          </div>
          <div className="profile-avatar-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleAvatarClick}
              disabled={avatarLoading}
            >
              Upload photo
            </button>
            {profile?.avatar && (
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-danger"
                onClick={handleAvatarRemove}
                disabled={avatarLoading}
              >
                Remove
              </button>
            )}
          </div>
          {avatarError && (
            <div className="profile-error" role="alert">
              {avatarError}
            </div>
          )}
        </section>

        {/* Profile Info Section */}
        <section className="profile-block">
          <h2 className="profile-block-title">Account Information</h2>
          <form onSubmit={handleProfileSubmit} className="profile-form">
            {profileError && (
              <div className="profile-error" role="alert">
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="profile-success" role="status">
                {profileSuccess}
              </div>
            )}
            <label className="profile-label">
              Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="profile-input"
              />
            </label>
            <label className="profile-label">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="profile-input"
              />
            </label>
            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </section>

        {/* Password Section */}
        <section className="profile-block">
          <h2 className="profile-block-title">Security</h2>
          <ul className="profile-options">
            <li className="profile-option">
              <button
                type="button"
                className={`profile-option-btn ${activeOption === 'password' ? 'active' : ''}`}
                onClick={() => setActiveOption(activeOption === 'password' ? null : 'password')}
              >
                <span className="profile-option-label">Change password</span>
                <span className="profile-option-arrow">{activeOption === 'password' ? '▼' : '▶'}</span>
              </button>
              {activeOption === 'password' && (
                <div className="profile-option-content">
                  <form onSubmit={handlePasswordSubmit} className="profile-form">
                    {passwordError && (
                      <div className="profile-error" role="alert">
                        {passwordError}
                      </div>
                    )}
                    {passwordSuccess && (
                      <div className="profile-success" role="status">
                        {passwordSuccess}
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
                    <button type="submit" className="btn btn-primary" disabled={savingPassword}>
                      {savingPassword ? 'Updating…' : 'Update password'}
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
