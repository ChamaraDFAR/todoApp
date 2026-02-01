import pool from '../db.js';

/** Get list IDs the user can access (owned or member). */
export async function getListIdsForUser(userId) {
  const [owned] = await pool.query('SELECT id FROM lists WHERE owner_id = ?', [userId]);
  const [member] = await pool.query('SELECT list_id FROM list_members WHERE user_id = ?', [userId]);
  const ids = new Set([...owned.map((r) => r.id), ...member.map((r) => r.list_id)]);
  return Array.from(ids);
}

/** Check if user can view a list (owner or member). Returns { canView, canEdit, role: 'owner'|'editor'|'viewer' }. */
export async function getListAccess(userId, listId) {
  const [lists] = await pool.query('SELECT owner_id FROM lists WHERE id = ?', [listId]);
  if (lists.length === 0) return { canView: false, canEdit: false, role: null };
  if (lists[0].owner_id === userId) return { canView: true, canEdit: true, role: 'owner' };
  const [members] = await pool.query('SELECT role FROM list_members WHERE list_id = ? AND user_id = ?', [listId, userId]);
  if (members.length === 0) return { canView: false, canEdit: false, role: null };
  const role = members[0].role;
  return { canView: true, canEdit: role === 'editor', role };
}

/** Check if user can view a todo (owner of todo or list member). */
export async function canViewTodo(userId, todoId) {
  const [todos] = await pool.query('SELECT user_id, list_id FROM todos WHERE id = ?', [todoId]);
  if (todos.length === 0) return false;
  const t = todos[0];
  if (t.user_id === userId) return true;
  if (!t.list_id) return false;
  const { canView } = await getListAccess(userId, t.list_id);
  return canView;
}

/** Check if user can edit a todo (owner of todo or list editor/owner). */
export async function canEditTodo(userId, todoId) {
  const [todos] = await pool.query('SELECT user_id, list_id FROM todos WHERE id = ?', [todoId]);
  if (todos.length === 0) return false;
  const t = todos[0];
  if (t.user_id === userId) return true;
  if (!t.list_id) return false;
  const { canEdit } = await getListAccess(userId, t.list_id);
  return canEdit;
}
