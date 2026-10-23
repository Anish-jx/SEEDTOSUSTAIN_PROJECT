import { pool } from '../db.js';

class AutomationEngine {
    constructor() {
        this.interval = null;
        this.io = null;
    }

    setIO(io) {
        this.io = io;
    }

    start() {
        console.log('🤖 Automation Engine started...');
        // Run every minute
        this.interval = setInterval(() => this.processAllRules(), 60000);
        this.processAllRules(); // Run immediately on start
    }

    stop() {
        if (this.interval) clearInterval(this.interval);
    }

    async processAllRules() {
        try {
            // Get all enabled rules
            const rulesResult = await pool.query(
                'SELECT * FROM automation_rules WHERE enabled = TRUE'
            );
            const rules = rulesResult.rows;

            for (const rule of rules) {
                await this.evaluateRule(rule);
            }
        } catch (error) {
            console.error('Automation Engine error:', error);
        }
    }

    async evaluateRule(rule) {
        try {
            // Get latest sensor data for the device
            let query = 'SELECT * FROM sensor_readings';
            let params = [];

            if (rule.device_id) {
                query += ' WHERE device_id = $1';
                params.push(rule.device_id);
            }

            query += ' ORDER BY created_at DESC LIMIT 1';

            const readingResult = await pool.query(query, params);
            if (readingResult.rows.length === 0) return;

            const reading = readingResult.rows[0];
            const sensorValue = reading[this.mapField(rule.condition_field)];
            const threshold = parseFloat(rule.condition_threshold);

            let triggered = false;
            switch (rule.condition_operator) {
                case '>': triggered = sensorValue > threshold; break;
                case '<': triggered = sensorValue < threshold; break;
                case '>=': triggered = sensorValue >= threshold; break;
                case '<=': triggered = sensorValue <= threshold; break;
                case '==': triggered = sensorValue == threshold; break;
            }

            if (triggered) {
                await this.triggerAction(rule, reading);
            }
        } catch (error) {
            console.error(`Failed to evaluate rule ${rule.id}:`, error);
        }
    }

    mapField(field) {
        const mapping = {
            'temperature': 'air_temp',
            'humidity': 'humidity',
            'ph': 'ph',
            'ec': 'ec',
            'rootTemp': 'root_temp'
        };
        return mapping[field] || field;
    }

    async triggerAction(rule, reading) {
        // Only trigger if not triggered recently (e.g., within last 5 minutes)
        if (rule.last_triggered && (new Date() - new Date(rule.last_triggered) < 300000)) {
            return;
        }

        console.log(`🔥 Rule "${rule.name}" triggered for device ${rule.device_id || 'all'}`);

        const alertResult = await pool.query(
            `INSERT INTO alerts (user_id, device_id, severity, category, message)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                rule.user_id,
                rule.device_id,
                rule.priority === 'high' ? 'critical' : rule.priority === 'medium' ? 'warning' : 'info',
                rule.category,
                `Automation triggered: ${rule.name}. Action: ${rule.action}`
            ]
        );

        // 2. Emit alert via socket if available
        if (this.io) {
            this.io.emit('new_alert', alertResult.rows[0]);
        }

        // 2. Update last_triggered
        await pool.query(
            'UPDATE automation_rules SET last_triggered = NOW() WHERE id = $1',
            [rule.id]
        );

        // 3. In a real system, we would also send a command to the device here
    }
}

export const automationEngine = new AutomationEngine();
