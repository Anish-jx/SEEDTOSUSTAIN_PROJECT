import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Thermometer,
    Droplets,
    AlertTriangle,
    Cpu,
    Zap,
    Activity,
    ChevronRight,
    Leaf,
    Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';

export function Dashboard() {
    const { user } = useAuth();
    const { devices, alerts, fetchDevices, fetchAlerts, isLoading } = useStore();
    const [hasFetched, setHasFetched] = useState(false);

    // Fetch data on mount
    useEffect(() => {
        if (!hasFetched) {
            fetchDevices();
            fetchAlerts();
            setHasFetched(true);
        }
    }, [fetchDevices, fetchAlerts, hasFetched]);

    const activeAlerts = alerts.filter(a => !a.resolved).length;
    const onlineDevices = devices.filter(d => d.status === 'online').length;

    // Empty chart data - will be populated by real sensor readings
    const emptyChartData = Array.from({ length: 12 }, (_, i) => ({
        time: `${i * 2}:00`,
        temp: 0,
        humidity: 0
    }));

    const displayName = user?.displayName || user?.email?.split('@')[0] || 'Grower';

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Welcome, {displayName} 👋</h2>
                    <p className="text-muted-foreground mt-1">Here's what's happening with your home garden.</p>
                </div>
                <div className="flex items-center gap-4">
                    {devices.length > 0 ? (
                        <Badge className={cn(
                            "px-4 py-2",
                            onlineDevices > 0 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        )}>
                            <div className={cn("w-2 h-2 rounded-full mr-2", onlineDevices > 0 ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
                            {onlineDevices > 0 ? `${onlineDevices} Device${onlineDevices > 1 ? 's' : ''} Online` : 'All Devices Offline'}
                        </Badge>
                    ) : (
                        <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20 px-4 py-2">
                            No Devices Connected
                        </Badge>
                    )}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Active Devices"
                    value={onlineDevices.toString()}
                    subtitle={devices.length > 0 ? `of ${devices.length} total` : 'No devices yet'}
                    icon={Cpu}
                    color="primary"
                />
                <StatCard
                    title="Active Pods"
                    value={devices.reduce((sum, d) => sum + (d.pods?.length || 0), 0).toString()}
                    subtitle={devices.length > 0 ? `${devices.length} IoT device(s)` : 'No devices'}
                    icon={Leaf}
                    color="emerald"
                />
                <StatCard
                    title="Active Alerts"
                    value={activeAlerts.toString()}
                    subtitle={activeAlerts > 0 ? 'Requires attention' : 'All systems normal'}
                    icon={AlertTriangle}
                    color={activeAlerts > 0 ? "rose" : "emerald"}
                />
                <StatCard
                    title="Active Alerts"
                    value={activeAlerts.toString()}
                    subtitle={activeAlerts > 0 ? "Needs attention" : "All clear"}
                    icon={AlertTriangle}
                    color={activeAlerts > 0 ? "amber" : "emerald"}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Chart */}
                <Card className="lg:col-span-8 border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-8">
                        <div>
                            <CardTitle>Environmental Overview</CardTitle>
                            <CardDescription>Temperature and humidity trends from your sensors</CardDescription>
                        </div>
                        <Badge variant="outline" className="font-mono text-[10px]">
                            {devices.length > 0 ? 'Awaiting Data' : 'No Devices'}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full relative">
                            {devices.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center bg-muted/20 rounded-xl">
                                    <div className="text-center">
                                        <Cpu className="mx-auto text-muted-foreground mb-3" size={48} />
                                        <p className="text-muted-foreground font-medium">No devices connected</p>
                                        <p className="text-sm text-muted-foreground">Connect an aeroponic pod to see live data</p>
                                    </div>
                                </div>
                            )}
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={emptyChartData}>
                                    <defs>
                                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Area type="monotone" dataKey="temp" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" name="Temperature (°C)" />
                                    <Area type="monotone" dataKey="humidity" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorHum)" name="Humidity (%)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="lg:col-span-4 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common tasks and shortcuts</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <QuickAction icon={Cpu} label="View All Devices" to="/devices" />
                        <QuickAction icon={Zap} label="Automation Rules" to="/automation" />
                        <QuickAction icon={Activity} label="Analytics Dashboard" to="/analytics" />
                        <QuickAction icon={AlertTriangle} label="Alert Center" to="/alerts" badge={activeAlerts > 0 ? activeAlerts : undefined} />
                    </CardContent>
                </Card>
            </div>

            {/* Device Overview */}
            <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Your Home Garden</CardTitle>
                        <CardDescription>
                            {devices.length > 0
                                ? 'Real-time status of your household pods'
                                : 'Connect your first device to get started'}
                        </CardDescription>
                    </div>
                    <Link to="/devices" className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                        {devices.length > 0 ? 'View All' : 'Add Device'} <ChevronRight size={16} />
                    </Link>
                </CardHeader>
                <CardContent>
                    {devices.length === 0 ? (
                        <div className="text-center py-12 bg-muted/20 rounded-2xl">
                            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                <Plus size={40} className="text-primary" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">No Devices Connected</h3>
                            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                                Connect your smart pod to start monitoring temperature, humidity, pH, and more in real-time.
                            </p>
                            <Link
                                to="/devices"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                            >
                                <Plus size={18} />
                                Add Your First Device
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {devices.map((device) => (
                                <Link key={device.id} to={`/device/${device.id}`} className="block group">
                                    <div className="p-5 bg-muted/20 rounded-2xl space-y-4 transition-all hover:bg-muted/40 hover:shadow-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                    <Leaf size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm">{device.name}</h4>
                                                    <p className="text-[10px] text-muted-foreground font-mono">{device.id.slice(0, 8)}...</p>
                                                </div>
                                            </div>
                                            <Badge className={cn(
                                                "text-[10px]",
                                                device.status === 'online' ? "bg-emerald-500" : "bg-muted text-muted-foreground"
                                            )}>
                                                {device.status}
                                            </Badge>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">Health Score</span>
                                                <span className="font-bold">{device.healthScore}%</span>
                                            </div>
                                            <Progress value={device.healthScore} className="h-1.5" />
                                        </div>
                                        <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
                                            <span className="text-muted-foreground">Growing: {device.crop || 'Not set'}</span>
                                            <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({ title, value, subtitle, icon: Icon, color }: any) {
    const colors: Record<string, string> = {
        primary: 'bg-primary/10 text-primary',
        rose: 'bg-rose-500/10 text-rose-500',
        blue: 'bg-blue-500/10 text-blue-500',
        amber: 'bg-amber-500/10 text-amber-500',
        emerald: 'bg-emerald-500/10 text-emerald-500',
    };

    return (
        <Card className="border-none shadow-sm">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
                        <h4 className="text-3xl font-bold mt-2">{value}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                    </div>
                    <div className={cn("p-3 rounded-2xl", colors[color])}>
                        <Icon size={24} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function QuickAction({ icon: Icon, label, to, badge }: any) {
    return (
        <Link to={to} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl hover:bg-muted/40 transition-all group">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon size={18} />
                </div>
                <span className="font-medium text-sm">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {badge && (
                    <Badge className="bg-rose-500 text-white text-[10px] px-2">{badge}</Badge>
                )}
                <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
        </Link>
    );
}
