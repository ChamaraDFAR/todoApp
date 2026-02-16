import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../upload.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// All profile routes require authentication
router.use(requireAuth);

// GET /api/profile - Get current user's profile
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, name, avatar FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/profile - Update name and/or email
router.put('/', async (req, res) => {
  try {
    const { name, email } = req.body;
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name ? String(name).trim() : null);
    }

    if (email !== undefined) {
      const emailNorm = String(email).trim().toLowerCase();
      if (!emailNorm) {
        return res.status(400).json({ error: 'Email cannot be empty' });
      }
      // Check if email is already taken by another user
      const [existing] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [emailNorm, req.user.id]
      );
      if (existing.length > 0) {
        return res.status(409).json({ error: 'Email already in use' });
      }
      updates.push('email = ?');
      values.push(emailNorm);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.user.id);
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Return updated profile
    const [rows] = await pool.query(
      'SELECT id, email, name, avatar FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/profile/avatar - Upload profile picture
router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get current avatar to delete old file
    const [rows] = await pool.query(
      'SELECT avatar FROM users WHERE id = ?',
      [req.user.id]
    );

    const oldAvatar = rows[0]?.avatar;

    // Update avatar in database
    await pool.query(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [req.file.filename, req.user.id]
    );

    // Delete old avatar file if exists
    if (oldAvatar) {
      const oldPath = path.join(__dirname, '..', 'uploads', oldAvatar);
      fs.unlink(oldPath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Failed to delete old avatar:', err);
        }
      });
    }

    // Return updated profile
    const [updated] = await pool.query(
      'SELECT id, email, name, avatar FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/profile/avatar - Remove profile picture
router.delete('/avatar', async (req, res) => {
  try {
    // Get current avatar
    const [rows] = await pool.query(
      'SELECT avatar FROM users WHERE id = ?',
      [req.user.id]
    );

    const avatar = rows[0]?.avatar;

    if (!avatar) {
      return res.status(404).json({ error: 'No avatar to delete' });
    }

    // Remove avatar from database
    await pool.query(
      'UPDATE users SET avatar = NULL WHERE id = ?',
      [req.user.id]
    );

    // Delete avatar file
    const avatarPath = path.join(__dirname, '..', 'uploads', avatar);
    fs.unlink(avatarPath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('Failed to delete avatar file:', err);
      }
    });

    // Return updated profile
    const [updated] = await pool.query(
      'SELECT id, email, name, avatar FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
