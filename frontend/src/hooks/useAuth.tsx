import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { blink } from '@/lib/blink';

interface User {
    id: string;
    email: string;
    displayName?: string;
    role: string;
    iotSetupType?: 'single' | 'multiple' | 'both';
    metadata?: Record<string, any>;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean; // Only for initial auth check
    login: (email: string, password: string) => Promise<void>;
    signup: (data: { email: string; password: string; displayName?: string; role?: string; securityQuestion?: string; securityAnswer?: string }) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true); // Only true during initial check

    useEffect(() => {
        // Check for existing session on mount
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                if (token) {
                    const currentUser = await blink.auth.getCurrentUser();
                    if (currentUser) {
                        setUser(currentUser);
                    }
                } else {
                    const stored = localStorage.getItem('current_user');
                    if (stored) {
                        setUser(JSON.parse(stored));
                    }
                }
            } catch (e) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('current_user');
            } finally {
                setLoading(false); // Only set to false after initial check
            }
        };

        checkAuth();
    }, []);

    // Login - does NOT set global loading state
    const login = useCallback(async (email: string, password: string) => {
        const authUser = await blink.auth.login(email, password);
        setUser(authUser);
    }, []);

    // Signup - does NOT set global loading state  
    const signup = useCallback(async (data: { email: string; password: string; displayName?: string; role?: string; securityQuestion?: string; securityAnswer?: string }) => {
        const authUser = await blink.auth.signup(data);
        setUser(authUser);
    }, []);

    const logout = useCallback(async () => {
        await blink.auth.logout();
        setUser(null);
    }, []);

    const updateUser = useCallback((userData: Partial<User>) => {
        setUser(prev => prev ? { ...prev, ...userData } : null);
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            loading,
            login,
            signup,
            logout,
            updateUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
