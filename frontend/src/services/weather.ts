export interface WeatherData {
    temperature: number;
    humidity: number;
    conditions: string;
    windSpeed: number;
    precipitation: number;
    forecast: ForecastDay[];
}

export interface ForecastDay {
    date: string;
    high: number;
    low: number;
    conditions: string;
}

export async function getWeather(lat: number, lng: number): Promise<WeatherData> {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
        );
        const data = await response.json();

        const weatherCodes: Record<number, string> = {
            0: 'Clear sky',
            1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
            45: 'Fog', 48: 'Depositing rime fog',
            51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
            61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
            71: 'Slight snow fall', 73: 'Moderate snow fall', 75: 'Heavy snow fall',
            95: 'Thunderstorm',
        };

        return {
            temperature: data.current.temperature_2m,
            humidity: data.current.relative_humidity_2m,
            conditions: weatherCodes[data.current.weather_code] || 'Unknown',
            windSpeed: data.current.wind_speed_10m,
            precipitation: data.current.precipitation,
            forecast: data.daily.time.slice(0, 3).map((time: string, i: number) => ({
                date: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : time,
                high: data.daily.temperature_2m_max[i],
                low: data.daily.temperature_2m_min[i],
                conditions: weatherCodes[data.daily.weather_code[i]] || 'Unknown',
            })),
        };
    } catch (error) {
        console.error('Failed to fetch weather:', error);
        throw error;
    }
}

export async function getAQI(lat: number, lng: number): Promise<number> {
    try {
        const response = await fetch(
            `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi`
        );
        const data = await response.json();
        return data.current.us_aqi;
    } catch (error) {
        console.error('Failed to fetch AQI:', error);
        return 0;
    }
}

export async function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => reject(err)
        );
    });
}
