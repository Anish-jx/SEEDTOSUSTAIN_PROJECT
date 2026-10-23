# Seed2Sustain Environment Setup Script
# Run this script to create your .env file

$envContent = @"
# Seed2Sustain Environment Configuration
# Generated automatically - Update values as needed

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Authentication
JWT_SECRET=seed2sustain-secret-key-2026-aeroponic-farm-change-in-production

# Database Configuration (PostgreSQL - Aiven Cloud)
DB_HOST=pg-2903a3c5-rohanxyz333-d1cf.d.aivencloud.com
DB_PORT=19815
DB_NAME=defaultdb
DB_USER=avnadmin
DB_PASSWORD=YOUR_DB_PASSWORD
DB_SSL=true

# Ollama AI Configuration (Local AI Model)
# Make sure Ollama is installed and running on your computer
# Download from: https://ollama.ai
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
# Other popular models: mistral, codellama, llama2:13b, etc.

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:3001

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
"@

$envContent | Out-File -FilePath ".env" -Encoding utf8 -NoNewline
Write-Host "✅ .env file created successfully!" -ForegroundColor Green
Write-Host "⚠️  Please review and update the .env file with your actual values" -ForegroundColor Yellow
