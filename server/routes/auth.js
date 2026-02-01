import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';
import { signToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const emailNorm = String(email).trim().toLowerCase();
    if (!emailNorm) return res.status(400).json({ error: 'Invalid email' });
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [emailNorm, password_hash]
    );
    const userId = result.insertId;
    const token = signToken({ id: userId, email: emailNorm });
    res.status(201).json({ user: { id: userId, email: emailNorm }, token });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const emailNorm = String(email).trim().toLowerCase();
    const [rows] = await pool.query('SELECT id, email, password_hash FROM users WHERE email = ?', [emailNorm]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
    const token = signToken({ id: user.id, email: user.email });
    res.json({ user: { id: user.id, email: user.email }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
