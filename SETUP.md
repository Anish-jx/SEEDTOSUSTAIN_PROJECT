# Seed2Sustain Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables

**Option A: Use the setup script (Windows)**
```powershell
powershell -ExecutionPolicy Bypass -File setup-env.ps1
```

**Option B: Manual setup**
```bash
cp .env.example .env
# Then edit .env with your values
```

### 3. Configure Your Environment

Edit `.env` file and update these critical values:

#### Required:
- ✅ Database credentials - Already configured for Aiven Cloud
- ✅ Ollama - Must be installed and running locally
- ⚠️ `JWT_SECRET` - **CHANGE THIS IN PRODUCTION!**

#### Optional:
- `OLLAMA_BASE_URL` - Ollama server URL (default: http://localhost:11434)
- `OLLAMA_MODEL` - Model name (default: llama2)
- `PORT` - Server port (default: 3001)
- `CORS_ORIGIN` - Allowed frontend origins

### 4. Start the Application

**Full Stack (Recommended):**
```bash
npm run dev:full
```

This starts:
- Backend server on http://localhost:3001
- Frontend dev server on http://localhost:5173

**Or separately:**

Backend:
```bash
npm run server
```

Frontend:
```bash
npm run dev
```

### 5. Verify Setup

1. Check backend health: http://localhost:3001/api/health
2. Open frontend: http://localhost:5173
3. Check server logs for:
   - ✅ Database connection
   - ✅ Ollama AI configuration
   - ✅ Server running message

## AI Configuration

### Ollama Setup

1. **Install Ollama**:
   - Download from: https://ollama.ai
   - Install and start the Ollama service

2. **Download a Model**:
   ```bash
   ollama pull llama2
   ```
   Or use other models like `mistral`, `codellama`, etc.

3. **Verify Ollama is Running**:
   - Check: http://localhost:11434
   - Or run: `ollama list`

4. **Configure in `.env`**:
   - `OLLAMA_BASE_URL` - Default: http://localhost:11434
   - `OLLAMA_MODEL` - Default: llama2 (change to your model)

## Troubleshooting

### .env file not found
- Run `setup-env.ps1` script
- Or copy `.env.example` to `.env`

### Database connection fails
- Verify credentials in `.env`
- Check network access to database
- Ensure SSL certificate exists (if required)

### AI not working
- **Make sure Ollama is running**: Check http://localhost:11434
- Verify model is downloaded: Run `ollama list`
- Check `OLLAMA_BASE_URL` and `OLLAMA_MODEL` in `.env`
- Review server logs for connection errors
- Try pulling the model again: `ollama pull llama2`

### Port already in use
- Change `PORT` in `.env`
- Or kill the process using the port

## Production Deployment

Before deploying to production:

1. **Change JWT_SECRET** - Generate a strong random secret
2. **Update CORS_ORIGIN** - Set to your production domain
3. **Secure Database** - Use production credentials
4. **Set NODE_ENV=production**
5. **Review all environment variables**

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NUGEN_API_KEY` | Yes | - | Nugen AI API key |
| `DB_HOST` | Yes | - | Database host |
| `DB_PORT` | Yes | 19815 | Database port |
| `DB_NAME` | Yes | defaultdb | Database name |
| `DB_USER` | Yes | avnadmin | Database user |
| `DB_PASSWORD` | Yes | - | Database password |
| `JWT_SECRET` | Yes | (default) | JWT signing secret |
| `PORT` | No | 3001 | Server port |
| `HF_TOKEN` | No | - | Hugging Face token |
| `CORS_ORIGIN` | No | localhost | Allowed origins |

## Next Steps

1. ✅ Environment configured
2. ✅ Dependencies installed
3. ✅ Server running
4. 🎉 Start using Seed2Sustain!

For more details, see [README.md](./README.md)
