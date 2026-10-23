import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/alerts - Get all alerts for current user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT a.id, a.device_id, a.severity, a.category, a.message, a.resolved, a.created_at,
              d.name as device_name
       FROM alerts a
       LEFT JOIN devices d ON a.device_id = d.id
       WHERE a.user_id = $1 
       ORDER BY a.created_at DESC
       LIMIT 100`,
            [req.user.id]
        );

        res.json(result.rows.map(a => ({
            id: a.id,
            deviceId: a.device_id,
            deviceName: a.device_name,
            severity: a.severity,
            category: a.category,
            message: a.message,
            resolved: a.resolved,
            timestamp: a.created_at,
        })));
    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({ error: 'Failed to get alerts' });
    }
});

// POST /api/alerts - Create new alert
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { deviceId, severity, category, message } = req.body;

        const result = await pool.query(
            `INSERT INTO alerts (user_id, device_id, severity, category, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, device_id, severity, category, message, resolved, created_at`,
            [req.user.id, deviceId, severity, category, message]
        );

        const a = result.rows[0];
        res.status(201).json({
            id: a.id,
            deviceId: a.device_id,
            severity: a.severity,
            category: a.category,
            message: a.message,
            resolved: a.resolved,
            timestamp: a.created_at,
        });
    } catch (error) {
        console.error('Create alert error:', error);
        res.status(500).json({ error: 'Failed to create alert' });
    }
});

// PUT /api/alerts/:id/resolve - Resolve alert
router.put('/:id/resolve', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE alerts SET resolved = true WHERE id = $1 AND user_id = $2
       RETURNING id, resolved`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        res.json({ id: result.rows[0].id, resolved: true });
    } catch (error) {
        console.error('Resolve alert error:', error);
        res.status(500).json({ error: 'Failed to resolve alert' });
    }
});

// DELETE /api/alerts/:id - Delete alert
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM alerts WHERE id = $1 AND user_id = $2 RETURNING id',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        res.json({ message: 'Alert deleted' });
    } catch (error) {
        console.error('Delete alert error:', error);
        res.status(500).json({ error: 'Failed to delete alert' });
    }
});

export default router;
