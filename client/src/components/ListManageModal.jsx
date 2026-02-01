import { useState, useEffect } from 'react';
import {
  getList,
  updateList,
  deleteList,
  inviteToList,
  removeFromList,
} from '../api';
import './ListManageModal.css';

function ListManageModal({ listId, listName: initialName, onClose, onUpdated, onDeleted, currentUserId }) {
  const [list, setList] = useState(null);
  const [name, setName] = useState(initialName || '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getList(listId)
      .then(setList)
      .catch(() => setList(null));
  }, [listId]);

  useEffect(() => {
    if (list) setName(list.name);
  }, [list]);

  const handleRename = async (e) => {
    e.preventDefault();
    if (!list?.my_role || list.my_role !== 'owner') return;
    setError(null);
    setLoading(true);
    try {
      await updateList(listId, { name: name.trim() || list.name });
      setList((l) => (l ? { ...l, name: name.trim() || list.name } : l));
      setSuccess('List renamed.');
      onUpdated?.();
    } catch (err) {
      setError(err.message || 'Failed to rename');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      setError('Enter an email address');
      return;
    }
    setLoading(true);
    try {
      await inviteToList(listId, email, inviteRole);
      const updated = await getList(listId);
      setList(updated);
      setInviteEmail('');
      setSuccess(`Invitation sent to ${email}`);
      onUpdated?.();
    } catch (err) {
      setError(err.message || 'Failed to invite');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this member from the list?')) return;
    setError(null);
    setLoading(true);
    try {
      await removeFromList(listId, userId);
      const updated = await getList(listId);
      setList(updated);
      onUpdated?.();
    } catch (err) {
      setError(err.message || 'Failed to remove');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Leave this list? You will no longer see its todos.')) return;
    setError(null);
    setLoading(true);
    try {
      await removeFromList(listId, currentUserId);
      onClose();
      onUpdated?.();
    } catch (err) {
      setError(err.message || 'Failed to leave');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this list? Todos in it will become personal (unchanged).')) return;
    setError(null);
    setLoading(true);
    try {
      await deleteList(listId);
      onClose();
      onDeleted?.();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  if (!list) return <div className="list-manage-overlay" onClick={onClose}><div className="list-manage-card" onClick={e => e.stopPropagation()}>Loading…</div></div>;

  const isOwner = list.my_role === 'owner';

  return (
    <div className="list-manage-overlay" role="dialog" aria-modal="true" aria-label="Manage list">
      <div className="list-manage-card">
        <div className="list-manage-header">
          <h2>Manage list</h2>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">×</button>
        </div>

        {error && <div className="list-manage-error" role="alert">{error}</div>}
        {success && <div className="list-manage-success" role="status">{success}</div>}

        {isOwner && (
          <form onSubmit={handleRename} className="list-manage-section">
            <label className="list-manage-label">List name</label>
            <div className="list-manage-rename-row">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="list-manage-input"
              />
              <button type="submit" className="btn btn-ghost" disabled={loading}>Save</button>
            </div>
          </form>
        )}
        {!isOwner && <p className="list-manage-name">{list.name}</p>}

        <section className="list-manage-section">
          <h3 className="list-manage-section-title">Members</h3>
          <ul className="list-manage-members">
            <li className="list-manage-member">
              <span>{list.owner_email}</span>
              <span className="list-manage-role">owner</span>
            </li>
            {list.members?.map((m) => (
              <li key={m.user_id} className="list-manage-member">
                <span>{m.email}</span>
                <span className="list-manage-role">{m.role}</span>
                {(isOwner || list.my_role === 'editor') && m.user_id !== currentUserId && (
                  <button type="button" className="btn btn-ghost list-manage-remove" onClick={() => handleRemove(m.user_id)}>Remove</button>
                )}
              </li>
            ))}
          </ul>
        </section>

        {(isOwner || list.my_role === 'editor') && (
          <form onSubmit={handleInvite} className="list-manage-section">
            <h3 className="list-manage-section-title">Invite by email</h3>
            <div className="list-manage-invite-row">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="list-manage-input"
              />
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="list-manage-select">
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button type="submit" className="btn btn-primary" disabled={loading}>Invite</button>
            </div>
          </form>
        )}

        <div className="list-manage-actions">
          {!isOwner && (
            <button type="button" className="btn btn-ghost" onClick={handleLeave} disabled={loading}>Leave list</button>
          )}
          {isOwner && (
            <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={loading}>Delete list</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ListManageModal;
