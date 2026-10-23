# Seed2Sustain - Smart Aeroponics Platform

A comprehensive IoT-based aeroponics management system with AI-powered assistance and automation.

## Features

- 🌱 **Smart Device Management** - Monitor and control aeroponic devices
- 🤖 **AI-Powered Assistant** - Get expert advice on plant care and automation
- 📊 **Real-time Analytics** - Track sensor readings and device health
- 🗺️ **Farm Mapping** - Visualize device locations on an interactive map
- ⚙️ **Automation Builder** - Create custom automation rules
- 🔔 **Alert System** - Get notified about critical issues
- 💬 **AI Chatbot** - Interactive assistant for aeroponics questions

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Socket.io
- **Database**: PostgreSQL (Aiven Cloud)
- **AI**: Nugen AI (Primary) + Hugging Face (Fallback)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

**Required Environment Variables:**

- `NUGEN_API_KEY` - Your Nugen AI API key (required for AI features)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database credentials
- `JWT_SECRET` - Secret key for JWT token generation (change in production!)

**Optional:**
- `HF_TOKEN` - Hugging Face token (fallback AI provider)
- `PORT` - Server port (default: 3001)
- `CORS_ORIGIN` - Comma-separated list of allowed origins

### 3. Database Setup

The application will automatically create required tables on first run. Ensure your PostgreSQL database is accessible and credentials are correct in `.env`.

### 4. Run the Application

**Development Mode (Full Stack):**
```bash
npm run dev:full
```

This starts both the backend server (port 3001) and frontend dev server (port 5173).

**Or run separately:**

Backend only:
```bash
npm run server
```

Frontend only:
```bash
npm run dev
```

### 5. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

## AI Configuration

### Ollama (Local AI Model)

The application uses **Ollama** - a local AI model running on your computer for:
- **Chatbot**: Interactive Q&A about aeroponics
- **AI Advisor**: Automated recommendations for device optimization

#### Setup Ollama:

1. **Install Ollama**: Download from https://ollama.ai
2. **Pull a model**: Run `ollama pull llama2` (or your preferred model)
3. **Start Ollama**: The service runs automatically on `http://localhost:11434`
4. **Configure in `.env`**:
   - `OLLAMA_BASE_URL` - Default: `http://localhost:11434`
   - `OLLAMA_MODEL` - Default: `llama2` (change to your preferred model)

#### Popular Models:
- `llama2` - General purpose (default)
- `mistral` - Fast and efficient
- `codellama` - Code-focused
- `llama2:13b` - Larger, more capable

The system automatically uses the chat endpoint for better conversation handling.

## Project Structure

```
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── services/          # API services (AI, weather, etc.)
│   └── store/             # State management
├── server/                 # Backend Express server
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── middleware/        # Auth middleware
└── public/                 # Static assets
```

## API Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/devices` - List devices
- `POST /api/ai/proxy` - AI chat/completions proxy

## Environment Variables Reference

See `.env.example` for a complete list of available environment variables.

## Security Notes

- **Never commit `.env` file** - It contains sensitive credentials
- Change `JWT_SECRET` in production
- Use strong database passwords
- Configure CORS appropriately for production

## Troubleshooting

### AI Not Working
- Check that `NUGEN_API_KEY` is set in `.env`
- Verify API key is valid
- Check server logs for error messages
- System will automatically fall back to Hugging Face if configured

### Database Connection Issues
- Verify database credentials in `.env`
- Ensure database is accessible from your network
- Check SSL certificate path if using SSL

### CORS Errors
- Update `CORS_ORIGIN` in `.env` with your frontend URL
- Ensure backend and frontend URLs match

## License

Private - All rights reserved
