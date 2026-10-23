/**
 * Seed2Sustain AI Service
 * Enhanced AI service with better error handling and context awareness
 */

export interface AISuggestion {
    title: string;
    description: string;
    routine: Record<string, string>;
    why: string;
    warning?: string;
}

export interface AIResponse {
    content: string;
    suggestions?: AISuggestion[];
}

const API_URL = import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/api/ai/proxy`
    : "http://localhost:3001/api/ai/proxy";

export class AIService {
    /**
     * Call AI backend proxy with enhanced error handling
     */
    private static async callAI(
        prompt: string, 
        systemPrompt?: string, 
        context?: any
    ): Promise<string> {
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    prompt,
                    systemPrompt,
                    context 
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const result = await response.json();

            // The backend returns standardized format: [{ generated_text: "..." }]
            if (Array.isArray(result) && result[0]?.generated_text) {
                return result[0].generated_text.trim();
            }

            // Handle error responses
            if (result.error) {
                console.error("AI Proxy returned error:", result.error);
                throw new Error(result.error);
            }

            return "";
        } catch (error) {
            console.error("Failed to call AI Proxy:", error);
            throw error;
        }
    }

    /**
     * Get assistant response for chatbot
     * Enhanced with better context and error handling
     */
    static async getAssistantResponse(query: string, systemData: any): Promise<AIResponse> {
        const deviceContext = systemData.devices?.map((d: any) =>
            `- Device: ${d.name}, Status: ${d.status}, Health: ${d.healthScore}%, Crop: ${d.crop}`
        ).join('\n') || "No active devices.";

        const systemPrompt = `You are the "Seed2Sustain Assistant", an expert AI support agent for a smart aeroponics platform.

STRICT RULES:
1. Answer ONLY questions related to aeroponics, plant growth, sensors, IoT, dashboard, alerts, automation, nutrients, and sustainability.
2. If asked about unrelated topics (stocks, coding, etc.), politely redirect: "I can only help with Seed2Sustain system and aeroponics-related questions."
3. Keep responses concise, clear, friendly, and practical (2-4 sentences max).
4. Use bullet points for multi-step instructions.
5. Reference the live system data when relevant to provide personalized advice.

LIVE SYSTEM DATA:
${deviceContext}`;

        try {
            const llmResponse = await this.callAI(query, systemPrompt, { devices: systemData.devices });
            
            if (llmResponse && llmResponse.trim()) {
                return { content: llmResponse };
            }
        } catch (error) {
            console.error("AI service error:", error);
        }

        // Fallback to rule-based responses if API fails
        return this.getFallbackAssistantResponse(query, systemData);
    }

    private static getFallbackAssistantResponse(query: string, systemData: any): AIResponse {
        const q = query.toLowerCase();
        if (q.includes('ph')) return { content: "pH measures water acidity. (Fallback Logic) Target: 5.5 - 6.5." };
        return { content: "I'm having trouble connecting to my brain, but I'm still here to help with your aeroponics questions!" };
    }

    /**
     * Get automation advice for a specific device
     * Enhanced with better JSON parsing and error recovery
     */
    static async getAutomationAdvice(device: any): Promise<AISuggestion[]> {
        if (!device) return [];

        const systemPrompt = `You are the "Seed2Sustain Automation Advisor", an expert in aeroponic cultivation.

Your task: Generate optimized misting, nutrient, and lighting routines for aeroponic devices.

Device Context:
- Crop: ${device.crop || 'Unknown'}
- Health Score: ${device.healthScore || 100}%
- Status: ${device.status || 'unknown'}

CRITICAL: You MUST respond with ONLY valid JSON, no additional text before or after.

Required JSON format:
[
  {
    "title": "Strategy Name (e.g., 'Aggressive Growth' or 'Recovery Mode')",
    "description": "One sentence summary",
    "routine": {
      "mist": "Duration and interval (e.g., '30s every 5m')",
      "nutrient": "Amount and frequency (e.g., '50ml every 4h')",
      "light": "Schedule (e.g., '16h ON / 8h OFF')"
    },
    "why": "Scientific rationale (2-3 sentences)",
    "warning": "Safety advice if health score is below 70%"
  }
]

Generate 2-3 different strategy options. Return ONLY the JSON array.`;

        try {
            const llmResponse = await this.callAI(
                `Generate automation recommendations for ${device.crop || 'this crop'}.`,
                systemPrompt,
                { device }
            );

            if (!llmResponse) {
                throw new Error("Empty response from AI");
            }

            // Try multiple JSON extraction strategies
            let jsonData = null;

            // Strategy 1: Direct JSON parse
            try {
                jsonData = JSON.parse(llmResponse);
            } catch {
                // Strategy 2: Extract JSON from markdown code blocks
                const codeBlockMatch = llmResponse.match(/```(?:json)?\s*(\[.*?\])\s*```/s);
                if (codeBlockMatch) {
                    jsonData = JSON.parse(codeBlockMatch[1]);
                } else {
                    // Strategy 3: Find first JSON array
                    const jsonMatch = llmResponse.match(/\[[\s\S]*\]/);
                    if (jsonMatch) {
                        jsonData = JSON.parse(jsonMatch[0]);
                    }
                }
            }

            if (jsonData && Array.isArray(jsonData) && jsonData.length > 0) {
                // Validate structure
                const validSuggestions = jsonData.filter(s => 
                    s.title && s.description && s.routine && s.why
                );
                
                if (validSuggestions.length > 0) {
                    return validSuggestions;
                }
            }
        } catch (error) {
            console.error("Failed to get automation advice:", error);
        }

        // Fallback: Return sensible defaults based on health score
        const healthScore = device.healthScore || 100;
        const isLowHealth = healthScore < 70;

        return [
            {
                title: isLowHealth ? "Recovery Mode" : "Standard Growth",
                description: isLowHealth 
                    ? "Gentle routine to help plants recover"
                    : "Balanced growth cycle for healthy plants",
                routine: {
                    mist: isLowHealth ? "20s every 10m" : "30s every 8m",
                    nutrient: isLowHealth ? "30ml every 6h" : "40ml every 4h",
                    light: isLowHealth ? "12h ON / 12h OFF" : "15h ON / 9h OFF"
                },
                why: isLowHealth
                    ? "Reduced frequency allows stressed plants to recover without overwhelming their systems."
                    : "Balanced cycle supports steady vegetative growth and nutrient uptake.",
                warning: isLowHealth ? "Monitor closely and adjust if health score continues to decline." : undefined
            }
        ];
    }
}
