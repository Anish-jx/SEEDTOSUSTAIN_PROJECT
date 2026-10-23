import { create } from 'zustand';
import { blink } from '@/lib/blink';

interface Device {
    id: string;
    name: string;
    status: 'online' | 'offline';
    healthScore: number;
    crop: string;
    location?: { lat: number; lng: number };
    webUrl?: string;
}

interface Alert {
    id: string;
    deviceId: string;
    deviceName?: string;
    severity: 'info' | 'warning' | 'critical';
    category: string;
    message: string;
    timestamp: string;
    resolved: boolean;
}

interface AutomationRule {
    id: string;
    name: string;
    deviceId: string;
    condition: string;
    operator: string;
    threshold: number;
    action: string;
    enabled: boolean;
    category: string;
    priority: 'low' | 'medium' | 'high';
    lastTriggered?: string;
}

interface SensorReading {
    deviceId: string;
    airTemp: number;
    rootTemp: number;
    humidity: number;
    ec: number;
    ph: number;
    timestamp: string;
}

interface StoreState {
    // Loading states
    isLoading: boolean;

    // UI State
    isMobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;

    // Devices
    devices: Device[];
    fetchDevices: () => Promise<void>;
    addDevice: (device: Omit<Device, 'id'>) => Promise<void>;
    updateDeviceReading: (deviceId: string, data: Partial<SensorReading>) => void;
    updateDeviceStatus: (deviceId: string, status: 'online' | 'offline') => void;

    // Alerts
    alerts: Alert[];
    fetchAlerts: () => Promise<void>;
    addAlert: (alert: Omit<Alert, 'id'>) => Promise<void>;
    resolveAlert: (id: string) => Promise<void>;

    // Automation Rules
    rules: AutomationRule[];
    fetchRules: () => Promise<void>;
    addRule: (rule: Omit<AutomationRule, 'id'>) => Promise<void>;
    toggleRule: (id: string, enabled: boolean) => Promise<void>;
    deleteRule: (id: string) => Promise<void>;

    // Analytics (computed from real data)
    getAnalytics: () => { avgTemp: number; avgHumidity: number; devicesOnline: number; alertsActive: number };
}

export const useStore = create<StoreState>((set, get) => ({
    // Loading state
    isLoading: false,

    // UI State
    isMobileMenuOpen: false,
    setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

    // Devices - Start with empty array, fetch from API
    devices: [],
    fetchDevices: async () => {
        set({ isLoading: true });
        try {
            const devices = await blink.db.devices.list();
            set({ devices: devices as Device[] });
        } catch (error) {
            console.error('Failed to fetch devices:', error);
            set({ devices: [] });
        } finally {
            set({ isLoading: false });
        }
    },
    addDevice: async (device) => {
        try {
            const newDevice = await blink.db.devices.create(device);
            set((state) => ({ devices: [newDevice as Device, ...state.devices] }));
        } catch (error) {
            console.error('Failed to add device:', error);
            throw error;
        }
    },
    updateDeviceReading: (deviceId, data) => {
        console.log(`Device ${deviceId} reading:`, data);
    },
    updateDeviceStatus: (deviceId, status) => {
        set((state) => ({
            devices: state.devices.map((d) =>
                d.id === deviceId ? { ...d, status } : d
            ),
        }));
    },

    // Alerts - Start with empty array, fetch from API
    alerts: [],
    fetchAlerts: async () => {
        try {
            const alerts = await blink.db.alerts.list();
            set({ alerts: alerts as Alert[] });
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
            set({ alerts: [] });
        }
    },
    addAlert: async (alert) => {
        try {
            const newAlert = await blink.db.alerts.create(alert);
            set((state) => ({ alerts: [newAlert as Alert, ...state.alerts] }));
        } catch (error) {
            console.error('Failed to add alert:', error);
        }
    },
    resolveAlert: async (id) => {
        set((state) => ({
            alerts: state.alerts.map((a) =>
                a.id === id ? { ...a, resolved: true } : a
            ),
        }));
        try {
            await blink.db.alerts.update(id, { resolved: true });
        } catch (error) {
            console.error('Failed to resolve alert:', error);
        }
    },

    // Automation Rules - Start with empty array, fetch from API
    rules: [],
    fetchRules: async () => {
        try {
            const rules = await blink.db.automationRules.list();
            set({ rules: rules as AutomationRule[] });
        } catch (error) {
            console.error('Failed to fetch rules:', error);
            set({ rules: [] });
        }
    },
    addRule: async (rule) => {
        try {
            const newRule = await blink.db.automationRules.create(rule);
            set((state) => ({ rules: [...state.rules, newRule as AutomationRule] }));
        } catch (error) {
            console.error('Failed to add rule:', error);
        }
    },
    toggleRule: async (id, enabled) => {
        set((state) => ({
            rules: state.rules.map((r) =>
                r.id === id ? { ...r, enabled } : r
            ),
        }));
        try {
            await blink.db.automationRules.update(id, { enabled });
        } catch (error) {
            console.error('Failed to toggle rule:', error);
        }
    },
    deleteRule: async (id) => {
        set((state) => ({
            rules: state.rules.filter((r) => r.id !== id),
        }));
        try {
            await blink.db.automationRules.delete(id);
        } catch (error) {
            console.error('Failed to delete rule:', error);
        }
    },

    // Analytics - Computed from real device data
    getAnalytics: () => {
        const { devices, alerts } = get();
        return {
            avgTemp: 0, // Will be updated when hardware sends data
            avgHumidity: 0,
            devicesOnline: devices.filter(d => d.status === 'online').length,
            alertsActive: alerts.filter(a => !a.resolved).length,
        };
    },
}));