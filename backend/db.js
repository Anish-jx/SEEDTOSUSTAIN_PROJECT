import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'pg-2903a3c5-rohanxyz333-d1cf.d.aivencloud.com',
  port: parseInt(process.env.DB_PORT || '19815'),
  database: process.env.DB_NAME || 'defaultdb',
  user: process.env.DB_USER || 'avnadmin',
  password: process.env.DB_PASSWORD || 'YOUR_DB_PASSWORD',
  max: 20, // Connection pool limit
};

// SSL configuration
let sslConfig = false;
if (process.env.DB_SSL === 'true' || process.env.DB_SSL === undefined) {
  try {
    // Try to read CA certificate if it exists
    const certPath = path.join(__dirname, 'ca-certificate.crt');
    if (fs.existsSync(certPath)) {
      const caCert = fs.readFileSync(certPath).toString();
      sslConfig = {
        rejectUnauthorized: true,
        ca: caCert,
      };
    } else {
      // If no cert file, use basic SSL
      sslConfig = {
        rejectUnauthorized: false,
      };
    }
  } catch (error) {
    console.warn('⚠️ Could not load SSL certificate, using basic SSL config');
    sslConfig = {
      rejectUnauthorized: false,
    };
  }
}

// Create PostgreSQL connection pool
const pool = new Pool({
  ...dbConfig,
  ssl: sslConfig,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err);
});

// Initialize database tables
async function initDatabase() {
  const client = await pool.connect();
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'grower',
        security_question VARCHAR(255),
        security_answer_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Add security columns if they don't exist (for existing tables)
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS security_question VARCHAR(255);
    `).catch(() => { });
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS security_answer_hash VARCHAR(255);
    `).catch(() => { });

    // Create devices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'offline',
        health_score INTEGER DEFAULT 100,
        crop VARCHAR(255),
        location_lat DECIMAL(10, 8),
        location_lng DECIMAL(11, 8),
        web_url VARCHAR(2048),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Add web_url column if it doesn't exist
    await client.query(`
      ALTER TABLE devices ADD COLUMN IF NOT EXISTS web_url VARCHAR(2048);
    `).catch(() => { });

    // Add IoT setup type to users table
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS iot_setup_type VARCHAR(50) DEFAULT 'single';
    `).catch(() => { });

    // Create pods table (multiple pods per IoT device)
    await client.query(`
      CREATE TABLE IF NOT EXISTS pods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        crop VARCHAR(255),
        position VARCHAR(50),
        status VARCHAR(50) DEFAULT 'offline',
        health_score INTEGER DEFAULT 100,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Update sensor_readings to support pods and new sensor data
    await client.query(`
      ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS pod_id UUID REFERENCES pods(id) ON DELETE CASCADE;
    `).catch(() => { });

    // Add MQ3 gas sensor columns
    await client.query(`
      ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS alcohol_ppm DECIMAL(6, 2);
    `).catch(() => { });
    await client.query(`
      ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS smoke_ppm DECIMAL(6, 2);
    `).catch(() => { });
    await client.query(`
      ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS lpg_ppm DECIMAL(6, 2);
    `).catch(() => { });
    await client.query(`
      ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS co_ppm DECIMAL(6, 2);
    `).catch(() => { });
    await client.query(`
      ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS analog_raw INTEGER;
    `).catch(() => { });
    await client.query(`
      ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS sensor_voltage DECIMAL(6, 3);
    `).catch(() => { });
    await client.query(`
      ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS sensor_resistance DECIMAL(12, 2);
    `).catch(() => { });
    await client.query(`
      ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS sensor_ratio DECIMAL(10, 3);
    `).catch(() => { });

    // Create alerts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
        severity VARCHAR(50) NOT NULL,
        category VARCHAR(100),
        message TEXT NOT NULL,
        resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create automation_rules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS automation_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        device_id UUID,
        name VARCHAR(255) NOT NULL,
        condition_field VARCHAR(100),
        condition_operator VARCHAR(20),
        condition_threshold DECIMAL(10, 2),
        action TEXT,
        enabled BOOLEAN DEFAULT TRUE,
        category VARCHAR(100),
        priority VARCHAR(20) DEFAULT 'medium',
        last_triggered TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create sensor_readings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sensor_readings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
        air_temp DECIMAL(5, 2),
        root_temp DECIMAL(5, 2),
        humidity DECIMAL(5, 2),
        ec DECIMAL(5, 3),
        ph DECIMAL(4, 2),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

export { pool, initDatabase };
