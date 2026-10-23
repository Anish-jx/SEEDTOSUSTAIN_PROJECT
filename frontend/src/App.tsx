import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { VantaBackground } from './components/layout/VantaBackground';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { FarmMap } from './pages/FarmMap';
import { DeviceDetail } from './pages/DeviceDetail';
import { DeviceList } from './pages/DeviceList';
import { AutomationBuilder } from './pages/AutomationBuilder';
import { Analytics } from './pages/Analytics';
import { AlertsCenter } from './pages/AlertsCenter';
import { Settings } from './pages/Settings';
import { AuthPage } from './pages/Auth';
import { useAuth } from './hooks/useAuth';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';
import { AIChatBot } from './components/layout/AIChatBot';
import { io } from 'socket.io-client';
import { useStore } from './store/useStore';

// Initialize socket outside the component or in a ref/effect
const SOCKET_URL = 'http://localhost:3001';

function App() {
    const { isAuthenticated, loading: authLoading, user } = useAuth();
    const { updateDeviceStatus, addAlert } = useStore();

    useEffect(() => {
        if (isAuthenticated && user) {
            const socket = io(SOCKET_URL, {
                auth: { token: localStorage.getItem('auth_token') }
            });

            socket.on('connect', () => {
                console.log('✅ Connected to real-time sync server');
            });

            socket.on('device_status_update', (data) => {
                updateDeviceStatus(data.deviceId, data.status);
            });

            socket.on('new_alert', (alert) => {
                addAlert(alert);
            });

            return () => {
                socket.disconnect();
            };
        }
    }, [isAuthenticated, user, updateDeviceStatus, addAlert]);

    if (authLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <Router>
            <div className="min-h-screen bg-transparent font-sans text-foreground relative">
                {isAuthenticated && <VantaBackground />}
                {isAuthenticated && <Header />}

                <main className={isAuthenticated ? "pt-24 max-w-[1400px] mx-auto px-4 md:px-8 pb-8 animate-in fade-in duration-500 relative z-10" : ""}>
                    <Routes>
                        {/* Public Routes */}
                        {!isAuthenticated ? (
                            <>
                                <Route path="/" element={<Landing />} />
                                <Route path="/auth" element={<AuthPage />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </>
                        ) : (
                            <>
                                {/* Protected Routes */}
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/map" element={<FarmMap />} />
                                <Route path="/device/:id" element={<DeviceDetail />} />
                                <Route path="/devices" element={<DeviceList />} />
                                <Route path="/automation" element={<AutomationBuilder />} />
                                <Route path="/analytics" element={<Analytics />} />
                                <Route path="/alerts" element={<AlertsCenter />} />
                                <Route path="/settings" element={<Settings />} />
                                {/* Redirect auth page to dashboard when already logged in */}
                                <Route path="/auth" element={<Navigate to="/" replace />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </>
                        )}
                    </Routes>
                </main>

                {isAuthenticated && <AIChatBot />}
                <Toaster position="top-right" richColors />
            </div>
        </Router>
    );
}

export default App;
