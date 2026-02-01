import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { getListAccess, getListIdsForUser } from '../lib/listAccess.js';

const router = express.Router();
router.use(requireAuth);

const userId = (req) => req.user.id;

// GET my lists (owned + member of)
router.get('/', async (req, res) => {
  try {
    const [owned] = await pool.query(
      `SELECT l.id, l.name, l.owner_id, l.created_at, 'owner' AS my_role
       FROM lists l WHERE l.owner_id = ?
       ORDER BY l.name`,
      [userId(req)]
    );
    const [memberOf] = await pool.query(
      `SELECT l.id, l.name, l.owner_id, l.created_at, m.role AS my_role
       FROM lists l
       INNER JOIN list_members m ON m.list_id = l.id AND m.user_id = ?
       ORDER BY l.name`,
      [userId(req)]
    );
    const lists = [...owned, ...memberOf];
    res.json(lists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create list
router.post('/', async (req, res) => {
  try {
    const name = (req.body.name || 'Untitled list').trim() || 'Untitled list';
    const [result] = await pool.query('INSERT INTO lists (owner_id, name) VALUES (?, ?)', [userId(req), name]);
    const [rows] = await pool.query('SELECT * FROM lists WHERE id = ?', [result.insertId]);
    res.status(201).json({ ...rows[0], my_role: 'owner' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single list with members (if I have access)
router.get('/:id', async (req, res) => {
  try {
    const access = await getListAccess(userId(req), req.params.id);
    if (!access.canView) return res.status(404).json({ error: 'List not found' });
    const [lists] = await pool.query('SELECT * FROM lists WHERE id = ?', [req.params.id]);
    if (lists.length === 0) return res.status(404).json({ error: 'List not found' });
    const [ownerRow] = await pool.query('SELECT email FROM users WHERE id = ?', [lists[0].owner_id]);
    const [members] = await pool.query(
      `SELECT m.user_id, m.role, u.email FROM list_members m
       INNER JOIN users u ON u.id = m.user_id
       WHERE m.list_id = ?`,
      [req.params.id]
    );
    res.json({
      ...lists[0],
      my_role: access.role,
      owner_email: ownerRow[0]?.email,
      members: members.map((m) => ({ user_id: m.user_id, email: m.email, role: m.role })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH rename list (owner only)
router.patch('/:id', async (req, res) => {
  try {
    const access = await getListAccess(userId(req), req.params.id);
    if (!access.canEdit) return res.status(403).json({ error: 'Only the list owner can rename the list' });
    const [lists] = await pool.query('SELECT id FROM lists WHERE id = ? AND owner_id = ?', [req.params.id, userId(req)]);
    if (lists.length === 0) return res.status(404).json({ error: 'List not found' });
    const name = (req.body.name || '').trim() || 'Untitled list';
    await pool.query('UPDATE lists SET name = ? WHERE id = ?', [name, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM lists WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE list (owner only)
router.delete('/:id', async (req, res) => {
  try {
    const [lists] = await pool.query('SELECT id FROM lists WHERE id = ? AND owner_id = ?', [req.params.id, userId(req)]);
    if (lists.length === 0) return res.status(404).json({ error: 'List not found' });
    await pool.query('DELETE FROM list_members WHERE list_id = ?', [req.params.id]);
    await pool.query('UPDATE todos SET list_id = NULL WHERE list_id = ?', [req.params.id]);
    await pool.query('DELETE FROM lists WHERE id = ?', [req.params.id]);
    res.json({ message: 'List deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST invite member by email
router.post('/:id/members', async (req, res) => {
  try {
    const access = await getListAccess(userId(req), req.params.id);
    if (!access.canEdit) return res.status(403).json({ error: 'Only owners and editors can invite members' });
    const [lists] = await pool.query('SELECT id FROM lists WHERE id = ?', [req.params.id]);
    if (lists.length === 0) return res.status(404).json({ error: 'List not found' });
    const email = String(req.body.email || '').trim().toLowerCase();
    const role = req.body.role === 'viewer' ? 'viewer' : 'editor';
    if (!email) return res.status(400).json({ error: 'Email required' });
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ error: 'No user found with that email' });
    const targetUserId = users[0].id;
    if (targetUserId === userId(req)) return res.status(400).json({ error: 'You cannot add yourself' });
    const [owner] = await pool.query('SELECT owner_id FROM lists WHERE id = ?', [req.params.id]);
    if (targetUserId === owner[0].owner_id) return res.status(400).json({ error: 'Owner is already in the list' });
    await pool.query(
      'INSERT INTO list_members (list_id, user_id, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role)',
      [req.params.id, targetUserId, role]
    );
    res.status(201).json({ user_id: targetUserId, email, role });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') res.status(409).json({ error: 'User is already a member' });
    else res.status(500).json({ error: err.message });
  }
});

// DELETE remove member (owner only, or leave as member)
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const listId = req.params.id;
    const targetUserId = Number(req.params.userId);
    const access = await getListAccess(userId(req), listId);
    if (!access.canView) return res.status(404).json({ error: 'List not found' });
    if (targetUserId === userId(req)) {
      await pool.query('DELETE FROM list_members WHERE list_id = ? AND user_id = ?', [listId, userId(req)]);
      return res.json({ message: 'Left the list' });
    }
    if (!access.canEdit) return res.status(403).json({ error: 'Only owners and editors can remove members' });
    const [lists] = await pool.query('SELECT owner_id FROM lists WHERE id = ?', [listId]);
    if (lists.length === 0) return res.status(404).json({ error: 'List not found' });
    if (targetUserId === lists[0].owner_id) return res.status(400).json({ error: 'Cannot remove the list owner' });
    await pool.query('DELETE FROM list_members WHERE list_id = ? AND user_id = ?', [listId, targetUserId]);
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
