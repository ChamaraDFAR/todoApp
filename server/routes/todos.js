import express from 'express';
import pool from '../db.js';
import { upload } from '../upload.js';
import { requireAuth } from '../middleware/auth.js';
import { getListIdsForUser, canViewTodo, canEditTodo, getListAccess } from '../lib/listAccess.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
router.use(requireAuth);

const userId = (req) => req.user.id;

// GET all todos (owned + in lists I'm member of), with list info
router.get('/', async (req, res) => {
  try {
    const listIds = await getListIdsForUser(userId(req));
    const placeholders = listIds.length ? listIds.map(() => '?').join(',') : '0';
    const [rows] = await pool.query(
      `SELECT t.*, 
        (SELECT COUNT(*) FROM documents d WHERE d.todo_id = t.id) AS document_count,
        l.name AS list_name,
        u.email AS owner_email
       FROM todos t
       LEFT JOIN lists l ON l.id = t.list_id
       LEFT JOIN users u ON u.id = t.user_id
       WHERE t.user_id = ? OR (t.list_id IS NOT NULL AND t.list_id IN (${placeholders}))
       ORDER BY t.created_at DESC`,
      [userId(req), ...listIds]
    );
    const uid = userId(req);
    const listIdsToCheck = [...new Set(rows.filter((r) => r.list_id && r.user_id !== uid).map((r) => r.list_id))];
    const listEdit = {};
    for (const lid of listIdsToCheck) {
      const a = await getListAccess(uid, lid);
      listEdit[lid] = a.canEdit;
    }
    const withAccess = rows.map((r) => ({
      ...r,
      is_owner: r.user_id === uid,
      can_edit: r.user_id === uid || (r.list_id && listEdit[r.list_id]),
    }));
    res.json(withAccess);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single todo with documents (owner or list member)
router.get('/:id', async (req, res) => {
  try {
    const canView = await canViewTodo(userId(req), req.params.id);
    if (!canView) return res.status(404).json({ error: 'Todo not found' });
    const [todos] = await pool.query('SELECT * FROM todos WHERE id = ?', [req.params.id]);
    if (todos.length === 0) return res.status(404).json({ error: 'Todo not found' });
    const [docs] = await pool.query('SELECT id, original_name, filename, created_at FROM documents WHERE todo_id = ?', [req.params.id]);
    const canEdit = await canEditTodo(userId(req), req.params.id);
    res.json({ ...todos[0], documents: docs, can_edit: canEdit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create todo with optional documents (multipart); optional list_id
router.post('/with-documents', upload.array('files'), async (req, res) => {
  try {
    const title = req.body.title || 'Untitled';
    const description = req.body.description || '';
    const listId = req.body.list_id ? Number(req.body.list_id) : null;
    if (listId) {
      const access = await getListAccess(userId(req), listId);
      if (!access.canEdit) return res.status(403).json({ error: 'You cannot add todos to this list' });
    }
    const [result] = await pool.query(
      'INSERT INTO todos (user_id, list_id, title, description) VALUES (?, ?, ?, ?)',
      [userId(req), listId, title, description]
    );
    const todoId = result.insertId;
    const files = req.files || [];
    for (const f of files) {
      await pool.query(
        'INSERT INTO documents (todo_id, original_name, filename) VALUES (?, ?, ?)',
        [todoId, f.originalname, f.filename]
      );
    }
    const [rows] = await pool.query('SELECT * FROM todos WHERE id = ?', [todoId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create todo (JSON, no documents); optional list_id
router.post('/', async (req, res) => {
  try {
    const { title, description, list_id: listIdParam } = req.body;
    const listId = listIdParam ? Number(listIdParam) : null;
    if (listId) {
      const access = await getListAccess(userId(req), listId);
      if (!access.canEdit) return res.status(403).json({ error: 'You cannot add todos to this list' });
    }
    const [result] = await pool.query(
      'INSERT INTO todos (user_id, list_id, title, description) VALUES (?, ?, ?, ?)',
      [userId(req), listId, title || 'Untitled', description || '']
    );
    const [rows] = await pool.query('SELECT * FROM todos WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update todo (owner or list editor)
router.put('/:id', async (req, res) => {
  try {
    const canEdit = await canEditTodo(userId(req), req.params.id);
    if (!canEdit) return res.status(404).json({ error: 'Todo not found' });
    const { title, description, completed } = req.body;
    await pool.query(
      'UPDATE todos SET title = COALESCE(?, title), description = COALESCE(?, description), completed = COALESCE(?, completed), updated_at = NOW() WHERE id = ?',
      [title, description, completed, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM todos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Todo not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE todo (owner or list editor)
router.delete('/:id', async (req, res) => {
  try {
    const canEdit = await canEditTodo(userId(req), req.params.id);
    if (!canEdit) return res.status(404).json({ error: 'Todo not found' });
    const [docs] = await pool.query('SELECT filename FROM documents WHERE todo_id = ?', [req.params.id]);
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    for (const d of docs) {
      const filePath = path.join(uploadsDir, d.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await pool.query('DELETE FROM documents WHERE todo_id = ?', [req.params.id]);
    await pool.query('DELETE FROM todos WHERE id = ?', [req.params.id]);
    res.json({ message: 'Todo deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST upload document for a todo (owner or list editor)
router.post('/:id/documents', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const canEdit = await canEditTodo(userId(req), req.params.id);
    if (!canEdit) return res.status(404).json({ error: 'Todo not found' });
    const [result] = await pool.query(
      'INSERT INTO documents (todo_id, original_name, filename) VALUES (?, ?, ?)',
      [req.params.id, req.file.originalname, req.file.filename]
    );
    const [rows] = await pool.query('SELECT id, original_name, filename, created_at FROM documents WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET download document (owner or list member)
router.get('/:todoId/documents/:docId', async (req, res) => {
  try {
    const canView = await canViewTodo(userId(req), req.params.todoId);
    if (!canView) return res.status(404).json({ error: 'Document not found' });
    const [rows] = await pool.query(
      'SELECT d.* FROM documents d WHERE d.id = ? AND d.todo_id = ?',
      [req.params.docId, req.params.todoId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    const filePath = path.join(__dirname, '..', 'uploads', rows[0].filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });
    res.download(filePath, rows[0].original_name);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE document (owner or list editor)
router.delete('/:todoId/documents/:docId', async (req, res) => {
  try {
    const canEdit = await canEditTodo(userId(req), req.params.todoId);
    if (!canEdit) return res.status(404).json({ error: 'Document not found' });
    const [rows] = await pool.query(
      'SELECT d.filename FROM documents d WHERE d.id = ? AND d.todo_id = ?',
      [req.params.docId, req.params.todoId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    const filePath = path.join(__dirname, '..', 'uploads', rows[0].filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await pool.query('DELETE FROM documents WHERE id = ? AND todo_id = ?', [req.params.docId, req.params.todoId]);
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
