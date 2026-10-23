import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

/**
 * Seed2Sustain AI Proxy Service
 * 
 * Uses Ollama local AI model for chatbot and AI advisor
 * 
 * Environment Variables:
 * - OLLAMA_BASE_URL  -> Ollama server URL (default: http://localhost:11434)
 * - OLLAMA_MODEL     -> Model name to use (default: llama2)
 */
const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'llama2';

/**
 * Call Ollama local AI model
 * Supports both chat and generate endpoints
 */
async function callOllama(prompt, systemPrompt = null) {
    const ollamaUrl = process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_URL;
    const model = process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;

    const fetchFn = typeof globalThis.fetch === 'function' ? globalThis.fetch : fetch;

    // Build messages array for chat endpoint
    const messages = [];
    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    // Try chat endpoint first (preferred for conversations)
    try {
        console.log(`🤖 Ollama: Calling ${ollamaUrl}/api/chat with model "${model}"...`);
        
        const response = await fetchFn(`${ollamaUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                }
            }),
        });

        if (!response.ok) {
            // If chat endpoint fails, try generate endpoint
            if (response.status === 404) {
                throw new Error('Chat endpoint not available, trying generate endpoint...');
            }
            const errorText = await response.text();
            throw new Error(`Ollama API error: ${response.status} - ${errorText.substring(0, 200)}`);
        }

        const json = await response.json();

        // Extract content from Ollama chat response
        const content = json?.message?.content || json?.response || '';

        if (!content) {
            console.error('❌ Ollama: Could not extract content from response:', JSON.stringify(json).substring(0, 500));
            throw new Error('Unexpected Ollama response format');
        }

        console.log('✅ Ollama: Successfully got response');
        return [{
            generated_text: content.trim(),
        }];

    } catch (error) {
        // Fallback to generate endpoint if chat fails
        if (error.message.includes('generate endpoint')) {
            console.log(`🤖 Ollama: Trying /api/generate endpoint...`);
            
            const fullPrompt = systemPrompt 
                ? `${systemPrompt}\n\nUser: ${prompt}\nAssistant:`
                : prompt;

            const response = await fetchFn(`${ollamaUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model,
                    prompt: fullPrompt,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        top_p: 0.9,
                    }
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama generate endpoint error: ${response.status} - ${errorText.substring(0, 200)}`);
            }

            const json = await response.json();
            const content = json?.response || '';

            if (!content) {
                throw new Error('Unexpected Ollama generate response format');
            }

            console.log('✅ Ollama: Successfully got response from generate endpoint');
            return [{
                generated_text: content.trim(),
            }];
        }

        // Check if Ollama is running
        if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
            throw new Error(`Cannot connect to Ollama at ${ollamaUrl}. Make sure Ollama is running and accessible.`);
        }

        throw error;
    }
}

/**
 * AI Proxy Route
 * Routes requests to local Ollama instance
 */
router.post('/proxy', async (req, res) => {
    const { prompt, systemPrompt, context } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        // Enhance prompt with context if provided
        const enhancedPrompt = context 
            ? `${prompt}\n\nContext: ${JSON.stringify(context)}`
            : prompt;

        console.log('🤖 AI Proxy: Using Ollama local model...');
        const result = await callOllama(enhancedPrompt, systemPrompt);

        res.json(result);
    } catch (error) {
        console.error('❌ AI Proxy Exception:', error.message);
        
        // Provide helpful error messages
        let errorMessage = error.message;
        if (error.message.includes('ECONNREFUSED') || error.message.includes('Cannot connect')) {
            errorMessage = `Ollama is not running. Please start Ollama service on your computer. Expected URL: ${process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_URL}`;
        }

        res.status(500).json({ 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

export default router;
