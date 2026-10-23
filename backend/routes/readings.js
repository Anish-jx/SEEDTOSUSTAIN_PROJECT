import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { automationEngine } from '../services/automation-engine.js';

const router = express.Router();

// POST /api/readings - Ingest sensor data
// Note: In production, devices would have their own auth (API key)
router.post('/', async (req, res) => {
    try {
        const { 
            deviceId, 
            podId,
            airTemp, 
            rootTemp, 
            humidity, 
            ec, 
            ph,
            // MQ3 Gas Sensor data
            alcoholPpm,
            smokePpm,
            lpgPpm,
            coPpm,
            // Raw sensor data
            analogRaw,
            sensorVoltage,
            sensorResistance,
            sensorRatio
        } = req.body;

        if (!deviceId) {
            return res.status(400).json({ error: 'deviceId is required' });
        }

        const result = await pool.query(
            `INSERT INTO sensor_readings (
                device_id, pod_id, air_temp, root_temp, humidity, ec, ph,
                alcohol_ppm, smoke_ppm, lpg_ppm, co_ppm,
                analog_raw, sensor_voltage, sensor_resistance, sensor_ratio
            )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             RETURNING *`,
            [
                deviceId, podId || null, airTemp, rootTemp, humidity, ec, ph,
                alcoholPpm, smokePpm, lpgPpm, coPpm,
                analogRaw, sensorVoltage, sensorResistance, sensorRatio
            ]
        );

        // Trigger immediate evaluation for this device
        // We do this asynchronously to not block the ingestion response
        setImmediate(async () => {
            const rulesResult = await pool.query(
                'SELECT * FROM automation_rules WHERE enabled = TRUE AND (device_id = $1 OR device_id IS NULL)',
                [deviceId]
            );
            for (const rule of rulesResult.rows) {
                await automationEngine.evaluateRule(rule);
            }
        });

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Ingestion error:', error);
        res.status(500).json({ error: 'Failed to save reading' });
    }
});

// GET /api/readings/:deviceId - Get history
router.get('/:deviceId', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM sensor_readings 
             WHERE device_id = $1 
             ORDER BY created_at DESC 
             LIMIT 100`,
            [req.params.deviceId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get readings error:', error);
        res.status(500).json({ error: 'Failed to get readings' });
    }
});

export default router;
