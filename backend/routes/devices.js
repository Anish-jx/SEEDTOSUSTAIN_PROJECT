import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import fetch from 'node-fetch';

const router = express.Router();

// GET /api/devices - Get all devices for current user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, status, health_score, crop, location_lat, location_lng, web_url, created_at
       FROM devices WHERE user_id = $1 ORDER BY created_at DESC`,
            [req.user.id]
        );

        res.json(result.rows.map(d => ({
            id: d.id,
            name: d.name,
            status: d.status,
            healthScore: d.health_score,
            crop: d.crop,
            location: d.location_lat ? { lat: d.location_lat, lng: d.location_lng } : null,
            webUrl: d.web_url,
            createdAt: d.created_at,
        })));
    } catch (error) {
        console.error('Get devices error:', error);
        res.status(500).json({ error: 'Failed to get devices' });
    }
});

// GET /api/devices/:id - Get single device
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, status, health_score, crop, location_lat, location_lng, web_url, created_at
       FROM devices WHERE id = $1 AND user_id = $2`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Device not found' });
        }

        const d = result.rows[0];
        res.json({
            id: d.id,
            name: d.name,
            status: d.status,
            healthScore: d.health_score,
            crop: d.crop,
            location: d.location_lat ? { lat: d.location_lat, lng: d.location_lng } : null,
            webUrl: d.web_url,
            createdAt: d.created_at,
        });
    } catch (error) {
        console.error('Get device error:', error);
        res.status(500).json({ error: 'Failed to get device' });
    }
});

// POST /api/devices - Create new device
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, crop, status, webUrl } = req.body;

        const result = await pool.query(
            `INSERT INTO devices (user_id, name, crop, status, health_score, web_url)
       VALUES ($1, $2, $3, $4, 100, $5)
       RETURNING id, name, status, health_score, crop, web_url, created_at`,
            [req.user.id, name, crop || 'Unknown', status || 'offline', webUrl]
        );

        const d = result.rows[0];
        res.status(201).json({
            id: d.id,
            name: d.name,
            status: d.status,
            healthScore: d.health_score,
            crop: d.crop,
            webUrl: d.web_url,
            createdAt: d.created_at,
        });
    } catch (error) {
        console.error('Create device error:', error);
        res.status(500).json({ error: 'Failed to create device' });
    }
});

// PUT /api/devices/:id - Update device
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { name, status, healthScore, crop, webUrl } = req.body;

        const result = await pool.query(
            `UPDATE devices 
       SET name = COALESCE($1, name),
           status = COALESCE($2, status),
           health_score = COALESCE($3, health_score),
           crop = COALESCE($4, crop),
           web_url = COALESCE($5, web_url),
           updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING id, name, status, health_score, crop, web_url`,
            [name, status, healthScore, crop, webUrl, req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Device not found' });
        }

        const d = result.rows[0];
        res.json({
            id: d.id,
            name: d.name,
            status: d.status,
            healthScore: d.health_score,
            crop: d.crop,
            webUrl: d.web_url,
        });
    } catch (error) {
        console.error('Update device error:', error);
        res.status(500).json({ error: 'Failed to update device' });
    }
});

// DELETE /api/devices/:id - Delete device
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM devices WHERE id = $1 AND user_id = $2 RETURNING id',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Device not found' });
        }

        res.json({ message: 'Device deleted' });
    } catch (error) {
        console.error('Delete device error:', error);
        res.status(500).json({ error: 'Failed to delete device' });
    }
});

// GET /api/devices/proxy/fetch - Proxy endpoint to fetch sensor data (bypasses CORS)
router.get('/proxy/fetch', authenticateToken, async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ error: 'URL parameter is required' });
        }

        // Validate URL format
        let targetUrl;
        try {
            targetUrl = new URL(url);
            // Only allow http and https protocols for security
            if (!['http:', 'https:'].includes(targetUrl.protocol)) {
                return res.status(400).json({ error: 'Only HTTP and HTTPS URLs are allowed' });
            }
        } catch (e) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        console.log(`📡 Proxying request to: ${url}`);

        const fetchFn = typeof globalThis.fetch === 'function' ? globalThis.fetch : fetch;

        // Create timeout controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        // Fetch data from the sensor device (server-side, no CORS issues)
        const response = await fetchFn(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Seed2Sustain-Server/1.0',
            },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            return res.status(response.status).json({ 
                error: `Device returned status ${response.status}`,
                status: response.status 
            });
        }

        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            // If not JSON, return as text
            const text = await response.text();
            try {
                // Try to parse as JSON anyway
                data = JSON.parse(text);
            } catch {
                data = { raw: text };
            }
        }

        res.json(data);
    } catch (error) {
        console.error('Proxy fetch error:', error.message);
        
        // Provide helpful error messages
        if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
            return res.status(503).json({ 
                error: 'Cannot connect to device. Make sure it is reachable on your network.',
                details: error.message 
            });
        }
        
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
            return res.status(504).json({ 
                error: 'Device request timed out. The device may be offline or unreachable.',
                details: error.message 
            });
        }

        res.status(500).json({ 
            error: 'Failed to fetch data from device',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/devices/proxy/parse - Fetch and parse sensor data using Ollama
router.get('/proxy/parse', authenticateToken, async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ error: 'URL parameter is required' });
        }

        // Validate URL format
        let targetUrl;
        try {
            targetUrl = new URL(url);
            if (!['http:', 'https:'].includes(targetUrl.protocol)) {
                return res.status(400).json({ error: 'Only HTTP and HTTPS URLs are allowed' });
            }
        } catch (e) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        console.log(`🤖 Fetching and parsing device data from: ${url}`);

        const fetchFn = typeof globalThis.fetch === 'function' ? globalThis.fetch : fetch;

        // Step 1: Fetch raw data from device
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for AI processing

        const response = await fetchFn(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Seed2Sustain-Server/1.0',
            },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            return res.status(response.status).json({ 
                error: `Device returned status ${response.status}`,
                status: response.status 
            });
        }

        const contentType = response.headers.get('content-type') || '';
        let rawData;
        let rawText = '';

        if (contentType.includes('application/json')) {
            rawData = await response.json();
            rawText = JSON.stringify(rawData, null, 2);
        } else {
            rawText = await response.text();
            try {
                rawData = JSON.parse(rawText);
            } catch {
                rawData = { html: rawText };
            }
        }

        // Step 2: Use Ollama to extract structured sensor data
        const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        const model = process.env.OLLAMA_MODEL || 'llama2';

        const parsePrompt = `Extract all sensor readings from the following IoT device data. 
Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just the JSON):

{
  "temperature": number or null,
  "humidity": number or null,
  "mq3": {
    "alcohol": number or null,
    "smoke": number or null,
    "lpg": number or null,
    "co": number or null
  },
  "mq3Raw": {
    "analogRaw": number or null,
    "voltage": number or null,
    "resistance": number or null,
    "ratio": number or null
  },
  "status": "online" | "offline" | "error" | null,
  "deviceInfo": {
    "name": string or null,
    "model": string or null,
    "firmware": string or null
  }
}

Extract the following values:
- Temperature (look for "Temperature", "Temp", "°C" values)
- Humidity (look for "Humidity", "%" values)
- MQ3 Gas Sensor readings: Alcohol (Ethanol), Smoke, LPG (Propane), Carbon Monoxide (all in PPM)
- MQ3 Raw data: Analog Raw Value (ADC Reading), Sensor Voltage, Sensor Resistance (RS Value), Ratio (RS/RO)

If a value is not found, use null. Extract numbers as numbers, not strings.
Here is the device data to parse:

${rawText.substring(0, 8000)}`;

        console.log(`🤖 Using Ollama to parse sensor data...`);

        const ollamaResponse = await fetchFn(`${ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                prompt: parsePrompt,
                stream: false,
                options: {
                    temperature: 0.1, // Low temperature for more consistent JSON
                    top_p: 0.9,
                }
            }),
        });

        if (!ollamaResponse.ok) {
            console.error('Ollama parsing failed, returning raw data');
            return res.json({
                raw: rawData,
                parsed: null,
                error: 'Failed to parse with Ollama, returning raw data'
            });
        }

        const ollamaResult = await ollamaResponse.json();
        const aiResponse = ollamaResult.response || '';

        // Step 3: Extract JSON from Ollama response
        let parsedData = null;
        
        // Try to find JSON in the response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                parsedData = JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.error('Failed to parse Ollama JSON response:', e.message);
            }
        }

        // If parsing failed, try manual extraction from raw data
        if (!parsedData) {
            console.log('Attempting fallback parsing from raw data...');
            parsedData = extractSensorDataManually(rawData, rawText);
        }

        // Normalize the parsed data structure
        if (parsedData) {
            // Map temperature fields
            if (parsedData.temperature === null || parsedData.temperature === undefined) {
                parsedData.temperature = parsedData.airTemp || parsedData.temp || null;
            }
            // Ensure mq3 structure exists
            if (!parsedData.mq3) {
                parsedData.mq3 = {
                    alcohol: parsedData.alcohol || parsedData.alcoholPpm || null,
                    smoke: parsedData.smoke || parsedData.smokePpm || null,
                    lpg: parsedData.lpg || parsedData.lpgPpm || null,
                    co: parsedData.co || parsedData.coPpm || parsedData.carbonMonoxide || null,
                };
            }
            // Ensure mq3Raw structure exists
            if (!parsedData.mq3Raw) {
                parsedData.mq3Raw = {
                    analogRaw: parsedData.analogRaw || parsedData.adcReading || null,
                    voltage: parsedData.voltage || parsedData.sensorVoltage || null,
                    resistance: parsedData.resistance || parsedData.sensorResistance || null,
                    ratio: parsedData.ratio || parsedData.sensorRatio || null,
                };
            }
        }

        console.log('✅ Successfully parsed device data');

        res.json({
            raw: rawData,
            parsed: parsedData,
            source: url,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Parse device data error:', error.message);
        
        if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
            return res.status(503).json({ 
                error: 'Cannot connect to device or Ollama. Make sure both are reachable.',
                details: error.message 
            });
        }
        
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
            return res.status(504).json({ 
                error: 'Request timed out. The device or Ollama may be slow to respond.',
                details: error.message 
            });
        }

        res.status(500).json({ 
            error: 'Failed to parse device data',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Helper function to manually extract sensor data from text/HTML
function extractSensorDataManually(rawData, rawText) {
    const extracted = {
        temperature: null,
        humidity: null,
        mq3: {
            alcohol: null,
            smoke: null,
            lpg: null,
            co: null,
        },
        mq3Raw: {
            analogRaw: null,
            voltage: null,
            resistance: null,
            ratio: null,
        },
        status: 'online',
    };

    const text = typeof rawData === 'string' ? rawData : JSON.stringify(rawData);
    const lowerText = text.toLowerCase();

    // Extract temperature (look for patterns like "25.2°C", "Temperature: 25.2", etc.)
    const tempMatch = text.match(/(?:temperature|temp)[:\s]*([\d.]+)\s*°?c/gi);
    if (tempMatch) {
        const tempValue = parseFloat(tempMatch[0].match(/[\d.]+/)?.[0]);
        if (!isNaN(tempValue)) extracted.temperature = tempValue;
    }

    // Extract humidity (look for patterns like "66.0%", "Humidity: 66", etc.)
    const humidityMatch = text.match(/(?:humidity)[:\s]*([\d.]+)\s*%/gi);
    if (humidityMatch) {
        const humidityValue = parseFloat(humidityMatch[0].match(/[\d.]+/)?.[0]);
        if (!isNaN(humidityValue)) extracted.humidity = humidityValue;
    }

    // Extract MQ3 gas readings
    const alcoholMatch = text.match(/(?:alcohol|ethanol)[:\s]*([\d.]+)\s*ppm/gi);
    if (alcoholMatch) {
        const value = parseFloat(alcoholMatch[0].match(/[\d.]+/)?.[0]);
        if (!isNaN(value)) extracted.mq3.alcohol = value;
    }

    const smokeMatch = text.match(/(?:smoke)[:\s]*([\d.]+)\s*ppm/gi);
    if (smokeMatch) {
        const value = parseFloat(smokeMatch[0].match(/[\d.]+/)?.[0]);
        if (!isNaN(value)) extracted.mq3.smoke = value;
    }

    const lpgMatch = text.match(/(?:lpg|propane)[:\s]*([\d.]+)\s*ppm/gi);
    if (lpgMatch) {
        const value = parseFloat(lpgMatch[0].match(/[\d.]+/)?.[0]);
        if (!isNaN(value)) extracted.mq3.lpg = value;
    }

    const coMatch = text.match(/(?:carbon\s*monoxide|co)[:\s]*([\d.]+)\s*ppm/gi);
    if (coMatch) {
        const value = parseFloat(coMatch[0].match(/[\d.]+/)?.[0]);
        if (!isNaN(value)) extracted.mq3.co = value;
    }

    // Extract raw sensor data
    const analogMatch = text.match(/(?:analog|adc)[:\s]*(\d+)\s*\/?\s*1023/gi);
    if (analogMatch) {
        const value = parseInt(analogMatch[0].match(/\d+/)?.[0]);
        if (!isNaN(value)) extracted.mq3Raw.analogRaw = value;
    }

    const voltageMatch = text.match(/(?:voltage|v)[:\s]*([\d.]+)\s*v/gi);
    if (voltageMatch) {
        const value = parseFloat(voltageMatch[0].match(/[\d.]+/)?.[0]);
        if (!isNaN(value)) extracted.mq3Raw.voltage = value;
    }

    const resistanceMatch = text.match(/(?:resistance|rs)[:\s]*([\d,]+)\s*Ω/gi);
    if (resistanceMatch) {
        const value = parseFloat(resistanceMatch[0].match(/[\d,]+/)?.[0].replace(/,/g, ''));
        if (!isNaN(value)) extracted.mq3Raw.resistance = value;
    }

    const ratioMatch = text.match(/(?:ratio|rs\/ro)[:\s]*([\d.]+)/gi);
    if (ratioMatch) {
        const value = parseFloat(ratioMatch[0].match(/[\d.]+/)?.[0]);
        if (!isNaN(value)) extracted.mq3Raw.ratio = value;
    }

    return extracted;
}

export default router;
