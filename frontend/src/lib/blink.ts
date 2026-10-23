// Blink API client - connects to real PostgreSQL backend
// Replaces mock functions with actual API calls

const API_URL = 'http://localhost:3001/api';

interface User {
    id: string;
    email: string;
    displayName?: string;
    role: string;
    metadata?: Record<string, any>;
}

interface DbRecord {
    id: string;
    [key: string]: any;
}

// Token management
function getToken(): string | null {
    return localStorage.getItem('auth_token');
}

function setToken(token: string): void {
    localStorage.setItem('auth_token', token);
}

function removeToken(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
}

function getCurrentUserFromStorage(): User | null {
    const stored = localStorage.getItem('current_user');
    return stored ? JSON.parse(stored) : null;
}

function setCurrentUser(user: User): void {
    localStorage.setItem('current_user', JSON.stringify(user));
}

// API helper
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
}

export const blink = {
    auth: {
        getCurrentUser: async (): Promise<User | null> => {
            const token = getToken();
            if (!token) return null;

            try {
                const user = await apiRequest<User>('/auth/me');
                setCurrentUser(user);
                return user;
            } catch (error) {
                removeToken();
                return null;
            }
        },

        login: async (email: string, password: string): Promise<User> => {
            const response = await apiRequest<{ user: User; token: string }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            setToken(response.token);
            setCurrentUser(response.user);
            return response.user;
        },

        signup: async (data: {
            email: string;
            password: string;
            displayName?: string;
            role?: string;
            securityQuestion?: string;
            securityAnswer?: string;
        }): Promise<User> => {
            const response = await apiRequest<{ user: User; token: string }>('/auth/signup', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            setToken(response.token);
            setCurrentUser(response.user);
            return response.user;
        },

        logout: async (): Promise<void> => {
            removeToken();
        },

        updateMe: async (updates: Partial<User>): Promise<User> => {
            const user = await apiRequest<User>('/auth/me', {
                method: 'PUT',
                body: JSON.stringify(updates),
            });
            setCurrentUser(user);
            return user;
        },

        onAuthStateChanged: (callback: (user: User | null) => void): (() => void) => {
            // Check for existing token and validate
            const token = getToken();
            if (token) {
                blink.auth.getCurrentUser()
                    .then(user => callback(user))
                    .catch(() => callback(null));
            } else {
                setTimeout(() => callback(null), 100);
            }
            return () => { };
        },
    },

    db: {
        devices: {
            list: async (): Promise<DbRecord[]> => {
                return apiRequest<DbRecord[]>('/devices');
            },
            get: async (id: string): Promise<DbRecord> => {
                return apiRequest<DbRecord>(`/devices/${id}`);
            },
            create: async (data: any): Promise<DbRecord> => {
                return apiRequest<DbRecord>('/devices', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });
            },
            update: async (id: string, data: any): Promise<DbRecord> => {
                return apiRequest<DbRecord>(`/devices/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                });
            },
            delete: async (id: string): Promise<void> => {
                await apiRequest<void>(`/devices/${id}`, { method: 'DELETE' });
            },
        },

        alerts: {
            list: async (): Promise<DbRecord[]> => {
                return apiRequest<DbRecord[]>('/alerts');
            },
            create: async (data: any): Promise<DbRecord> => {
                return apiRequest<DbRecord>('/alerts', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });
            },
            update: async (id: string, data: any): Promise<DbRecord> => {
                return apiRequest<DbRecord>(`/alerts/${id}/resolve`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                });
            },
            delete: async (id: string): Promise<void> => {
                await apiRequest<void>(`/alerts/${id}`, { method: 'DELETE' });
            },
        },

        automationRules: {
            list: async (): Promise<DbRecord[]> => {
                return apiRequest<DbRecord[]>('/rules');
            },
            create: async (data: any): Promise<DbRecord> => {
                return apiRequest<DbRecord>('/rules', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });
            },
            update: async (id: string, data: any): Promise<DbRecord> => {
                return apiRequest<DbRecord>(`/rules/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                });
            },
            delete: async (id: string): Promise<void> => {
                await apiRequest<void>(`/rules/${id}`, { method: 'DELETE' });
            },
        },

        sensorReadings: {
            list: async (): Promise<DbRecord[]> => {
                return apiRequest<DbRecord[]>('/readings');
            },
            create: async (data: any): Promise<DbRecord> => {
                return apiRequest<DbRecord>('/readings', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });
            },
        },
    },
};
