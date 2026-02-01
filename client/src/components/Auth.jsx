import { useState } from 'react';
import { login, register, resetPassword, setToken } from '../api';
import './Auth.css';

function Auth({ onLoggedIn }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (mode === 'resetPassword') {
        if (newPassword.length < 6) {
          setError('New password must be at least 6 characters');
          setLoading(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          setError('New passwords do not match');
          setLoading(false);
          return;
        }
        await resetPassword(email.trim(), password, newPassword);
        setSuccess('Password updated. You can sign in with your new password.');
        setMode('login');
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const fn = mode === 'login' ? login : register;
        const { user, token } = await fn(email.trim(), password);
        setToken(token);
        onLoggedIn(user);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
  };

  if (mode === 'resetPassword') {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1 className="auth-title">Change password</h1>
          <p className="auth-subtitle">Enter your email and current password, then choose a new password.</p>
          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}
            {success && (
              <div className="auth-success" role="status">
                {success}
              </div>
            )}
            <label className="auth-label">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="auth-input"
              />
            </label>
            <label className="auth-label">
              Current password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="auth-input"
              />
            </label>
            <label className="auth-label">
              New password
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
                className="auth-input"
              />
            </label>
            <label className="auth-label">
              Confirm new password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="auth-input"
              />
            </label>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
          <p className="auth-switch">
            <button type="button" className="auth-link" onClick={() => switchMode('login')}>
              Back to sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">Todo App</h1>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
        </p>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="auth-success" role="status">
              {success}
            </div>
          )}
          <label className="auth-label">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="auth-input"
            />
          </label>
          <label className="auth-label">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'At least 6 characters' : ''}
              required
              minLength={mode === 'register' ? 6 : undefined}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="auth-input"
            />
          </label>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <p className="auth-switch">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            className="auth-link"
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
        {mode === 'login' && (
          <p className="auth-switch">
            <button
              type="button"
              className="auth-link"
              onClick={() => switchMode('resetPassword')}
            >
              Forgot password
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

export default Auth;
