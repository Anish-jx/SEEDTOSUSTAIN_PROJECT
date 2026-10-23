import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Thermometer,
    Droplets,
    Wind,
    Zap,
    Activity,
    Settings,
    Leaf,
    RefreshCw,
    ExternalLink,
    Globe
} from 'lucide-react';
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';

// Mock sensor data
const mockSensorData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    airTemp: 22 + Math.random() * 4,
    rootTemp: 20 + Math.random() * 2,
    humidity: 60 + Math.random() * 15,
    ec: 1.2 + Math.random() * 0.3,
    ph: 6.0 + Math.random() * 0.5
}));

export function DeviceDetail() {
    const { id } = useParams<{ id: string }>();
    const { devices } = useStore();

    const device = devices.find(d => d.id === id) || {
        id: id,
        name: 'Unknown Device',
        crop: 'Unknown',
        status: 'offline',
        healthScore: 0,
        webUrl: ''
    };

    const [liveData, setLiveData] = React.useState<any>(null);
    const [parsedData, setParsedData] = React.useState<any>(null);
    const [rawData, setRawData] = React.useState<any>(null);
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [isParsing, setIsParsing] = React.useState(false);

    const fetchLiveData = React.useCallback(async (useAI = true) => {
        if (!device.webUrl) return;

        setIsRefreshing(true);
        if (useAI) setIsParsing(true);

        try {
            const token = localStorage.getItem('auth_token');
            
            // Use AI parsing endpoint if requested, otherwise use simple fetch
            const endpoint = useAI ? 'proxy/parse' : 'proxy/fetch';
            const proxyUrl = `http://localhost:3001/api/devices/${endpoint}?url=${encodeURIComponent(device.webUrl)}`;
            
            const response = await fetch(proxyUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }).catch(() => null);
            
            if (response && response.ok) {
                const data = await response.json();
                
                if (useAI && data.parsed) {
                    // AI-parsed data
                    setParsedData(data.parsed);
                    setRawData(data.raw);
                    setLiveData(data.parsed); // Use parsed data for display
                    toast.success(`AI-parsed data from ${device.name}`);
                } else {
                    // Simple fetch data
                    setLiveData(data);
                    setParsedData(null);
                    setRawData(data);
                    toast.success(`Live data fetched from ${device.name}`);
                }
            } else {
                const errorData = response ? await response.json().catch(() => ({})) : {};
                toast.error(errorData.error || `Could not reach device at ${device.webUrl}`);
            }
        } catch (error) {
            console.error("Fetch live data error:", error);
            toast.error("Failed to fetch live data");
        } finally {
            setIsRefreshing(false);
            setIsParsing(false);
        }
    }, [device.webUrl, device.name]);

    React.useEffect(() => {
        if (device.webUrl) {
            fetchLiveData();
            // Polling every 30 seconds
            const interval = setInterval(fetchLiveData, 30000);
            return () => clearInterval(interval);
        }
    }, [device.webUrl, fetchLiveData]);

    // Build sensor cards from parsed data or live data
    const buildSensorCards = () => {
        const data = parsedData || liveData || {};
        const cards = [];

        // Primary sensors: Temperature and Humidity
        const temp = data.temperature !== null && data.temperature !== undefined 
            ? data.temperature 
            : (data.airTemp !== null && data.airTemp !== undefined ? data.airTemp : null);
        
        if (temp !== null) {
            cards.push({ 
                label: 'Temperature', 
                value: `${temp}°C`, 
                icon: Thermometer, 
                color: 'rose', 
                optimal: '20-30°C',
                warning: temp >= 30 ? 'High temperature warning' : null
            });
        }

        const humidity = data.humidity !== null && data.humidity !== undefined ? data.humidity : null;
        if (humidity !== null) {
            cards.push({ 
                label: 'Humidity', 
                value: `${humidity}%`, 
                icon: Droplets, 
                color: 'blue', 
                optimal: '60-70%',
                warning: humidity <= 70 ? null : 'High humidity warning'
            });
        }

        // MQ3 Gas Sensor readings
        if (data.mq3) {
            if (data.mq3.alcohol !== null && data.mq3.alcohol !== undefined) {
                const isSafe = data.mq3.alcohol < 50;
                cards.push({ 
                    label: 'Alcohol (Ethanol)', 
                    value: `${data.mq3.alcohol} PPM`, 
                    icon: Activity, 
                    color: isSafe ? 'emerald' : 'rose', 
                    optimal: 'Safe: < 50 PPM',
                    status: isSafe ? 'SAFE' : 'WARNING'
                });
            }
            if (data.mq3.smoke !== null && data.mq3.smoke !== undefined) {
                const isSafe = data.mq3.smoke < 50;
                cards.push({ 
                    label: 'Smoke', 
                    value: `${data.mq3.smoke} PPM`, 
                    icon: Activity, 
                    color: isSafe ? 'emerald' : 'rose', 
                    optimal: 'Safe: < 50 PPM',
                    status: isSafe ? 'SAFE' : 'WARNING'
                });
            }
            if (data.mq3.lpg !== null && data.mq3.lpg !== undefined) {
                const isSafe = data.mq3.lpg < 30;
                cards.push({ 
                    label: 'LPG (Propane)', 
                    value: `${data.mq3.lpg} PPM`, 
                    icon: Activity, 
                    color: isSafe ? 'emerald' : 'rose', 
                    optimal: 'Safe: < 30 PPM',
                    status: isSafe ? 'SAFE' : 'WARNING'
                });
            }
            if (data.mq3.co !== null && data.mq3.co !== undefined) {
                const isSafe = data.mq3.co < 50;
                cards.push({ 
                    label: 'Carbon Monoxide', 
                    value: `${data.mq3.co} PPM`, 
                    icon: Activity, 
                    color: isSafe ? 'emerald' : 'rose', 
                    optimal: 'Safe: < 50 PPM',
                    status: isSafe ? 'SAFE' : 'WARNING'
                });
            }
        }

        // MQ3 Raw Sensor Data
        if (data.mq3Raw) {
            if (data.mq3Raw.analogRaw !== null && data.mq3Raw.analogRaw !== undefined) {
                cards.push({ 
                    label: 'Analog Raw Value', 
                    value: `${data.mq3Raw.analogRaw} / 1023`, 
                    icon: Activity, 
                    color: 'slate', 
                    optimal: 'ADC Reading'
                });
            }
            if (data.mq3Raw.voltage !== null && data.mq3Raw.voltage !== undefined) {
                cards.push({ 
                    label: 'Sensor Voltage', 
                    value: `${data.mq3Raw.voltage}V`, 
                    icon: Zap, 
                    color: 'amber', 
                    optimal: 'Voltage Out'
                });
            }
            if (data.mq3Raw.resistance !== null && data.mq3Raw.resistance !== undefined) {
                const resistanceStr = data.mq3Raw.resistance >= 1000 
                    ? `${(data.mq3Raw.resistance / 1000).toFixed(0)}KΩ` 
                    : `${data.mq3Raw.resistance}Ω`;
                cards.push({ 
                    label: 'Sensor Resistance', 
                    value: resistanceStr, 
                    icon: Activity, 
                    color: 'slate', 
                    optimal: 'RS Value'
                });
            }
            if (data.mq3Raw.ratio !== null && data.mq3Raw.ratio !== undefined) {
                cards.push({ 
                    label: 'Ratio (RS/RO)', 
                    value: `${data.mq3Raw.ratio}`, 
                    icon: Activity, 
                    color: 'slate', 
                    optimal: 'Sensor Ratio'
                });
            }
        }

        // Legacy support for old data format
        if (data.airTemp !== null && data.airTemp !== undefined && !temp) {
            cards.push({ label: 'Air Temperature', value: `${data.airTemp}°C`, icon: Thermometer, color: 'rose', optimal: '20-25°C' });
        }
        if (data.rootTemp !== null && data.rootTemp !== undefined) {
            cards.push({ label: 'Root Temperature', value: `${data.rootTemp}°C`, icon: Thermometer, color: 'orange', optimal: '18-22°C' });
        }
        if (data.ec !== null && data.ec !== undefined) {
            cards.push({ label: 'EC Level', value: `${data.ec} mS`, icon: Zap, color: 'amber', optimal: '1.2-1.8 mS' });
        }
        if (data.ph !== null && data.ph !== undefined) {
            cards.push({ label: 'pH Level', value: `${data.ph}`, icon: Activity, color: 'purple', optimal: '5.5-6.5' });
        }

        // If no data found, show placeholder
        if (cards.length === 0) {
            cards.push(
                { label: 'Temperature', value: 'N/A', icon: Thermometer, color: 'rose', optimal: '20-30°C' },
                { label: 'Humidity', value: 'N/A', icon: Droplets, color: 'blue', optimal: '60-70%' }
            );
        }

        return cards;
    };

    const sensorCards = buildSensorCards();

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link to="/devices">
                        <Button variant="ghost" size="icon" className="rounded-xl">
                            <ArrowLeft size={20} />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <Leaf size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">{device.name}</h2>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-muted-foreground font-mono">{device.id}</span>
                                <Badge className={cn(
                                    device.status === 'online' ? "bg-emerald-500" : "bg-muted text-muted-foreground"
                                )}>
                                    {device.status}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    {device.webUrl && (
                        <a href={device.webUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="rounded-xl font-bold bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors">
                                <Globe size={18} className="mr-2 text-primary" />
                                Device Page
                                <ExternalLink size={14} className="ml-2 opacity-50" />
                            </Button>
                        </a>
                    )}
                    <Button
                        variant="outline"
                        className="rounded-xl font-bold"
                        onClick={() => fetchLiveData(true)}
                        disabled={isRefreshing || !device.webUrl}
                    >
                        <RefreshCw size={18} className={cn("mr-2", (isRefreshing || isParsing) && "animate-spin")} />
                        {isParsing ? "AI Parsing..." : isRefreshing ? "Fetching..." : "AI Parse"}
                    </Button>
                    <Button
                        variant="outline"
                        className="rounded-xl font-bold"
                        onClick={() => fetchLiveData(false)}
                        disabled={isRefreshing || !device.webUrl}
                    >
                        <RefreshCw size={18} className={cn("mr-2", isRefreshing && "animate-spin")} />
                        {isRefreshing ? "Fetching..." : "Quick Fetch"}
                    </Button>
                    <Button variant="outline" className="rounded-xl font-bold">
                        <Settings size={18} className="mr-2" />
                        Settings
                    </Button>
                </div>
            </div>

            {/* Health Overview */}
            <Card className="border-none shadow-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <h3 className="font-bold text-lg">System Health</h3>
                            <p className="text-sm text-muted-foreground">Overall performance and status monitoring</p>
                        </div>
                        <div className="flex items-center gap-8">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-primary">{device.healthScore}%</div>
                                <p className="text-xs text-muted-foreground mt-1">Health Score</p>
                            </div>
                            <div className="w-32">
                                <Progress value={device.healthScore} className="h-3" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="sensors" className="space-y-6">
                <TabsList className="bg-muted/30 p-1 rounded-2xl border-none">
                    <TabsTrigger value="sensors" className="rounded-xl px-6 py-2">Live Sensors</TabsTrigger>
                    <TabsTrigger value="history" className="rounded-xl px-6 py-2">History</TabsTrigger>
                    <TabsTrigger value="controls" className="rounded-xl px-6 py-2">Controls</TabsTrigger>
                </TabsList>

                <TabsContent value="sensors" className="space-y-6">
                    {parsedData && (
                        <Card className="border-none shadow-sm bg-primary/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity size={20} className="text-primary" />
                                    AI-Parsed Device Information
                                </CardTitle>
                                <CardDescription>
                                    Data extracted and structured by Ollama AI
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {parsedData.deviceInfo && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        {parsedData.deviceInfo.name && (
                                            <div>
                                                <p className="text-xs text-muted-foreground">Device Name</p>
                                                <p className="font-bold">{parsedData.deviceInfo.name}</p>
                                            </div>
                                        )}
                                        {parsedData.deviceInfo.model && (
                                            <div>
                                                <p className="text-xs text-muted-foreground">Model</p>
                                                <p className="font-bold">{parsedData.deviceInfo.model}</p>
                                            </div>
                                        )}
                                        {parsedData.deviceInfo.firmware && (
                                            <div>
                                                <p className="text-xs text-muted-foreground">Firmware</p>
                                                <p className="font-bold">{parsedData.deviceInfo.firmware}</p>
                                            </div>
                                        )}
                                        {parsedData.deviceInfo.uptime && (
                                            <div>
                                                <p className="text-xs text-muted-foreground">Uptime</p>
                                                <p className="font-bold">{parsedData.deviceInfo.uptime}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {parsedData.status && (
                                    <Badge className={cn(
                                        parsedData.status === 'online' ? "bg-emerald-500" : "bg-muted"
                                    )}>
                                        Status: {parsedData.status}
                                    </Badge>
                                )}
                            </CardContent>
                        </Card>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sensorCards.map((sensor) => (
                            <SensorCard key={sensor.label} {...sensor} />
                        ))}
                    </div>
                    {rawData && (
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle>Raw Device Data</CardTitle>
                                <CardDescription>Unprocessed data from device</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64">
                                    {JSON.stringify(rawData, null, 2)}
                                </pre>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>24-Hour Trend</CardTitle>
                            <CardDescription>Temperature and humidity over the last day</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={mockSensorData}>
                                        <defs>
                                            <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                        <Area type="monotone" dataKey="airTemp" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#tempGrad)" name="Air Temp (°C)" />
                                        <Area type="monotone" dataKey="humidity" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#humGrad)" name="Humidity (%)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="controls" className="space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardContent className="p-12 text-center">
                            <div className="w-16 h-16 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                <Settings size={32} className="text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold">Manual Controls</h3>
                            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                                Manual override controls for pumps, fans, and lighting. Use with caution as this bypasses automatic rules.
                            </p>
                            <Button className="mt-6 rounded-xl font-bold">
                                Enable Manual Mode
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function SensorCard({ label, value, icon: Icon, color, optimal, warning, status }: any) {
    const colors: Record<string, string> = {
        rose: 'bg-rose-500/10 text-rose-500',
        orange: 'bg-orange-500/10 text-orange-500',
        blue: 'bg-blue-500/10 text-blue-500',
        amber: 'bg-amber-500/10 text-amber-500',
        purple: 'bg-purple-500/10 text-purple-500',
        emerald: 'bg-emerald-500/10 text-emerald-500',
        cyan: 'bg-cyan-500/10 text-cyan-500',
        yellow: 'bg-yellow-500/10 text-yellow-500',
        green: 'bg-green-500/10 text-green-500',
        slate: 'bg-slate-500/10 text-slate-500',
    };

    return (
        <Card className="border-none shadow-sm">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
                            {status && (
                                <Badge 
                                    variant="outline" 
                                    className={cn(
                                        "text-[8px] px-1.5 py-0",
                                        status === 'SAFE' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                    )}
                                >
                                    {status}
                                </Badge>
                            )}
                        </div>
                        <h4 className="text-3xl font-bold mt-1">{value}</h4>
                        <p className="text-xs text-muted-foreground mt-2">{optimal}</p>
                        {warning && (
                            <p className="text-xs text-rose-600 mt-1 font-medium">⚠️ {warning}</p>
                        )}
                    </div>
                    <div className={cn("p-3 rounded-2xl", colors[color])}>
                        <Icon size={24} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
