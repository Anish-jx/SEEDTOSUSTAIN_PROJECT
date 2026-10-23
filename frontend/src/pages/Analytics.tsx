import React, { useEffect, useState } from 'react';
import {
    TrendingUp,
    Activity,
    Droplets,
    Thermometer,
    BarChart3,
    Calendar,
    Download,
    Cpu
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { cn } from '@/lib/utils';

export function Analytics() {
    const { devices, fetchDevices } = useStore();
    const [hasFetched, setHasFetched] = useState(false);

    useEffect(() => {
        if (!hasFetched) {
            fetchDevices();
            setHasFetched(true);
        }
    }, [fetchDevices, hasFetched]);

    const hasDevices = devices.length > 0;
    const onlineDevices = devices.filter(d => d.status === 'online').length;

    // Empty chart data placeholders
    const emptyWeeklyData = [
        { name: 'Mon', temp: 0, humidity: 0, growth: 0 },
        { name: 'Tue', temp: 0, humidity: 0, growth: 0 },
        { name: 'Wed', temp: 0, humidity: 0, growth: 0 },
        { name: 'Thu', temp: 0, humidity: 0, growth: 0 },
        { name: 'Fri', temp: 0, humidity: 0, growth: 0 },
        { name: 'Sat', temp: 0, humidity: 0, growth: 0 },
        { name: 'Sun', temp: 0, humidity: 0, growth: 0 },
    ];

    const emptyCropHealthData = [
        { name: 'Awaiting Data', value: 100, color: '#E5E7EB' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
                    <p className="text-muted-foreground mt-1">Performance metrics and environmental intelligence.</p>
                </div>
                <div className="flex gap-3">
                    <Select defaultValue="7d">
                        <SelectTrigger className="w-[140px] rounded-xl bg-card border-none shadow-sm">
                            <Calendar size={16} className="mr-2" />
                            <SelectValue placeholder="Time range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="24h">Last 24h</SelectItem>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 90 days</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="rounded-xl font-bold bg-card border-none shadow-sm" disabled={!hasDevices}>
                        <Download size={18} className="mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Avg Temperature"
                    value="--"
                    unit="°C"
                    icon={Thermometer}
                    trend={null}
                    color="rose"
                    subtitle="Awaiting sensor data"
                />
                <MetricCard
                    title="Avg Humidity"
                    value="--"
                    unit="%"
                    icon={Droplets}
                    trend={null}
                    color="blue"
                    subtitle="Awaiting sensor data"
                />
                <MetricCard
                    title="Growth Rate"
                    value="--"
                    unit="cm/day"
                    icon={TrendingUp}
                    trend={null}
                    color="emerald"
                    subtitle="No growth data yet"
                />
                <MetricCard
                    title="System Uptime"
                    value={hasDevices ? `${Math.round((onlineDevices / devices.length) * 100)}` : "--"}
                    unit="%"
                    icon={Activity}
                    trend={null}
                    color="primary"
                    subtitle={hasDevices ? `${onlineDevices} of ${devices.length} online` : "No devices"}
                />
            </div>

            {/* Empty State */}
            {!hasDevices && (
                <Card className="border-none shadow-sm">
                    <CardContent className="p-12 text-center">
                        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <BarChart3 size={40} className="text-primary" />
                        </div>
                        <h3 className="text-xl font-bold">No Analytics Data Yet</h3>
                        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                            Connect your first aeroponic device to start collecting data. Analytics will appear here once sensors begin reporting.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Environmental Trends */}
                <Card className="lg:col-span-8 border-none shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Environmental Trends</CardTitle>
                                <CardDescription>Temperature and humidity over time</CardDescription>
                            </div>
                            <Badge variant="outline" className="font-mono text-[10px]">
                                {hasDevices ? 'Awaiting Data' : 'No Devices'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] relative">
                            {!hasDevices && (
                                <div className="absolute inset-0 flex items-center justify-center bg-muted/10 rounded-xl z-10">
                                    <div className="text-center">
                                        <Cpu className="mx-auto text-muted-foreground mb-2" size={32} />
                                        <p className="text-sm text-muted-foreground">Connect devices to see trends</p>
                                    </div>
                                </div>
                            )}
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={emptyWeeklyData}>
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
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Area type="monotone" dataKey="temp" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" name="Temperature (°C)" />
                                    <Area type="monotone" dataKey="humidity" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorHum)" name="Humidity (%)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Crop Health Distribution */}
                <Card className="lg:col-span-4 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Crop Health Distribution</CardTitle>
                        <CardDescription>Overall health of your installations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={emptyCropHealthData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {emptyCropHealthData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gray-200" />
                                    <span className="text-muted-foreground">Awaiting Data</span>
                                </div>
                                <span className="font-medium">--</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Resource Usage */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle>Resource Consumption</CardTitle>
                    <CardDescription>Water and nutrient usage tracking</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] relative">
                        {!hasDevices && (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted/10 rounded-xl z-10">
                                <p className="text-sm text-muted-foreground">No resource data available</p>
                            </div>
                        )}
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'Water', value: 0, unit: 'L' },
                                { name: 'Nutrient A', value: 0, unit: 'L' },
                                { name: 'Nutrient B', value: 0, unit: 'L' },
                                { name: 'pH Buffer', value: 0, unit: 'L' },
                            ]}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} name="Usage" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function MetricCard({ title, value, unit, icon: Icon, trend, color, subtitle }: any) {
    const colors: Record<string, string> = {
        primary: 'bg-primary/10 text-primary',
        rose: 'bg-rose-500/10 text-rose-500',
        blue: 'bg-blue-500/10 text-blue-500',
        emerald: 'bg-emerald-500/10 text-emerald-500',
    };

    return (
        <Card className="border-none shadow-sm">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
                        <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-3xl font-bold">{value}</span>
                            <span className="text-muted-foreground text-sm">{unit}</span>
                        </div>
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
