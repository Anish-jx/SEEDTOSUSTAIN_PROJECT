import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/pods - Get all pods for a device
router.get('/device/:deviceId', authenticateToken, async (req, res) => {
    try {
        // Verify device belongs to user
        const deviceCheck = await pool.query(
            'SELECT id FROM devices WHERE id = $1 AND user_id = $2',
            [req.params.deviceId, req.user.id]
        );

        if (deviceCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Device not found' });
        }

        const result = await pool.query(
            `SELECT id, name, crop, position, status, health_score, created_at
             FROM pods WHERE device_id = $1 ORDER BY position, created_at`,
            [req.params.deviceId]
        );

        res.json(result.rows.map(p => ({
            id: p.id,
            name: p.name,
            crop: p.crop,
            position: p.position,
            status: p.status,
            healthScore: p.health_score,
            createdAt: p.created_at,
        })));
    } catch (error) {
        console.error('Get pods error:', error);
        res.status(500).json({ error: 'Failed to get pods' });
    }
});

// POST /api/pods - Create new pod
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { deviceId, name, crop, position } = req.body;

        if (!deviceId || !name) {
            return res.status(400).json({ error: 'Device ID and name are required' });
        }

        // Verify device belongs to user
        const deviceCheck = await pool.query(
            'SELECT id FROM devices WHERE id = $1 AND user_id = $2',
            [deviceId, req.user.id]
        );

        if (deviceCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Device not found' });
        }

        const result = await pool.query(
            `INSERT INTO pods (device_id, name, crop, position, status, health_score)
             VALUES ($1, $2, $3, $4, 'offline', 100)
             RETURNING id, name, crop, position, status, health_score, created_at`,
            [deviceId, name, crop || 'Unknown', position || null]
        );

        const p = result.rows[0];
        res.status(201).json({
            id: p.id,
            name: p.name,
            crop: p.crop,
            position: p.position,
            status: p.status,
            healthScore: p.health_score,
            createdAt: p.created_at,
        });
    } catch (error) {
        console.error('Create pod error:', error);
        res.status(500).json({ error: 'Failed to create pod' });
    }
});

// PUT /api/pods/:id - Update pod
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { name, crop, position, status, healthScore } = req.body;

        // Verify pod belongs to user's device
        const podCheck = await pool.query(
            `SELECT p.id FROM pods p
             JOIN devices d ON p.device_id = d.id
             WHERE p.id = $1 AND d.user_id = $2`,
            [req.params.id, req.user.id]
        );

        if (podCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Pod not found' });
        }

        const result = await pool.query(
            `UPDATE pods 
             SET name = COALESCE($1, name),
                 crop = COALESCE($2, crop),
                 position = COALESCE($3, position),
                 status = COALESCE($4, status),
                 health_score = COALESCE($5, health_score),
                 updated_at = NOW()
             WHERE id = $6
             RETURNING id, name, crop, position, status, health_score`,
            [name, crop, position, status, healthScore, req.params.id]
        );

        const p = result.rows[0];
        res.json({
            id: p.id,
            name: p.name,
            crop: p.crop,
            position: p.position,
            status: p.status,
            healthScore: p.health_score,
        });
    } catch (error) {
        console.error('Update pod error:', error);
        res.status(500).json({ error: 'Failed to update pod' });
    }
});

// DELETE /api/pods/:id - Delete pod
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        // Verify pod belongs to user's device
        const podCheck = await pool.query(
            `SELECT p.id FROM pods p
             JOIN devices d ON p.device_id = d.id
             WHERE p.id = $1 AND d.user_id = $2`,
            [req.params.id, req.user.id]
        );

        if (podCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Pod not found' });
        }

        await pool.query('DELETE FROM pods WHERE id = $1', [req.params.id]);

        res.json({ message: 'Pod deleted' });
    } catch (error) {
        console.error('Delete pod error:', error);
        res.status(500).json({ error: 'Failed to delete pod' });
    }
});

export default router;
