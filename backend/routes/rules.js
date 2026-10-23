import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/rules - Get all automation rules for current user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, device_id, name, condition_field, condition_operator, condition_threshold,
              action, enabled, category, priority, last_triggered, created_at
       FROM automation_rules WHERE user_id = $1 ORDER BY created_at DESC`,
            [req.user.id]
        );

        res.json(result.rows.map(r => ({
            id: r.id,
            deviceId: r.device_id || 'all',
            name: r.name,
            condition: r.condition_field,
            operator: r.condition_operator,
            threshold: parseFloat(r.condition_threshold),
            action: r.action,
            enabled: r.enabled,
            category: r.category,
            priority: r.priority,
            lastTriggered: r.last_triggered,
        })));
    } catch (error) {
        console.error('Get rules error:', error);
        res.status(500).json({ error: 'Failed to get rules' });
    }
});

// POST /api/rules - Create new rule
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, deviceId, condition, operator, threshold, action, category, priority } = req.body;

        const result = await pool.query(
            `INSERT INTO automation_rules 
       (user_id, device_id, name, condition_field, condition_operator, condition_threshold, action, category, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
            [req.user.id, deviceId === 'all' ? null : deviceId, name, condition, operator, threshold, action, category, priority]
        );

        const r = result.rows[0];
        res.status(201).json({
            id: r.id,
            deviceId: r.device_id || 'all',
            name: r.name,
            condition: r.condition_field,
            operator: r.condition_operator,
            threshold: parseFloat(r.condition_threshold),
            action: r.action,
            enabled: r.enabled,
            category: r.category,
            priority: r.priority,
        });
    } catch (error) {
        console.error('Create rule error:', error);
        res.status(500).json({ error: 'Failed to create rule' });
    }
});

// PUT /api/rules/:id - Update rule
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { enabled, name, action } = req.body;

        const result = await pool.query(
            `UPDATE automation_rules 
       SET enabled = COALESCE($1, enabled),
           name = COALESCE($2, name),
           action = COALESCE($3, action)
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
            [enabled, name, action, req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        const r = result.rows[0];
        res.json({
            id: r.id,
            deviceId: r.device_id || 'all',
            name: r.name,
            enabled: r.enabled,
        });
    } catch (error) {
        console.error('Update rule error:', error);
        res.status(500).json({ error: 'Failed to update rule' });
    }
});

// DELETE /api/rules/:id - Delete rule
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM automation_rules WHERE id = $1 AND user_id = $2 RETURNING id',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        res.json({ message: 'Rule deleted' });
    } catch (error) {
        console.error('Delete rule error:', error);
        res.status(500).json({ error: 'Failed to delete rule' });
    }
});

export default router;
