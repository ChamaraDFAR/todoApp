import express from 'express';
import pool from '../db.js';
import { upload } from '../upload.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// GET all todos (with document count)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, 
        (SELECT COUNT(*) FROM documents d WHERE d.todo_id = t.id) AS document_count
       FROM todos t
       ORDER BY t.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single todo with documents
router.get('/:id', async (req, res) => {
  try {
    const [todos] = await pool.query('SELECT * FROM todos WHERE id = ?', [req.params.id]);
    if (todos.length === 0) return res.status(404).json({ error: 'Todo not found' });
    const [docs] = await pool.query('SELECT id, original_name, filename, created_at FROM documents WHERE todo_id = ?', [req.params.id]);
    res.json({ ...todos[0], documents: docs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create todo with optional documents (multipart)
router.post('/with-documents', upload.array('files'), async (req, res) => {
  try {
    const title = req.body.title || 'Untitled';
    const description = req.body.description || '';
    const [result] = await pool.query(
      'INSERT INTO todos (title, description) VALUES (?, ?)',
      [title, description]
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

// POST create todo (JSON, no documents)
router.post('/', async (req, res) => {
  try {
    const { title, description } = req.body;
    const [result] = await pool.query(
      'INSERT INTO todos (title, description) VALUES (?, ?)',
      [title || 'Untitled', description || '']
    );
    const [rows] = await pool.query('SELECT * FROM todos WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update todo
router.put('/:id', async (req, res) => {
  try {
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

// DELETE todo (and its documents)
router.delete('/:id', async (req, res) => {
  try {
    const [docs] = await pool.query('SELECT filename FROM documents WHERE todo_id = ?', [req.params.id]);
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    for (const d of docs) {
      const filePath = path.join(uploadsDir, d.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await pool.query('DELETE FROM documents WHERE todo_id = ?', [req.params.id]);
    const [result] = await pool.query('DELETE FROM todos WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Todo not found' });
    res.json({ message: 'Todo deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST upload document for a todo
router.post('/:id/documents', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const [todos] = await pool.query('SELECT id FROM todos WHERE id = ?', [req.params.id]);
    if (todos.length === 0) return res.status(404).json({ error: 'Todo not found' });
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

// GET download document
router.get('/:todoId/documents/:docId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM documents WHERE id = ? AND todo_id = ?',
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

// DELETE document
router.delete('/:todoId/documents/:docId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT filename FROM documents WHERE id = ? AND todo_id = ?',
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
