import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initDatabase } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root directory
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import routes
import authRoutes from './routes/auth.js';
import devicesRoutes from './routes/devices.js';
import podsRoutes from './routes/pods.js';
import alertsRoutes from './routes/alerts.js';
import rulesRoutes from './routes/rules.js';
import readingsRoutes from './routes/readings.js';
import aiRoutes from './routes/ai.js';
import { automationEngine } from './services/automation-engine.js';

const app = express();
const httpServer = createServer(app);

// CORS configuration from environment
const corsOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

const io = new Server(httpServer, {
    cors: {
        origin: corsOrigins,
        credentials: true
    }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: corsOrigins,
    credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/pods', podsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/readings', readingsRoutes);
app.use('/api/ai', aiRoutes);

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('📱 Client connected to socket:', socket.id);

    socket.on('disconnect', () => {
        console.log('📱 Client disconnected from socket:', socket.id);
    });
});

// Initialize database and start server
async function startServer() {
    try {
        console.log('🌱 Starting Seed2Sustain API Server...');

        // Initialize database tables
        await initDatabase();

        // Start automation engine with socket support
        automationEngine.setIO(io);
        automationEngine.start();

        // Check Ollama configuration
        const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        const ollamaModel = process.env.OLLAMA_MODEL || 'llama2';
        
        console.log('✅ Ollama AI configured');
        console.log(`   URL: ${ollamaUrl}`);
        console.log(`   Model: ${ollamaModel}`);
        console.log('⚠️  Make sure Ollama is running on your computer for AI features to work.');

        httpServer.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📊 API endpoints recorded.`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
