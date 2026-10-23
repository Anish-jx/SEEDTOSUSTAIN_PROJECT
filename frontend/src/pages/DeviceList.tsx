import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Leaf,
    Plus,
    Search,
    Filter,
    ChevronRight,
    Cpu,
    Activity
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function DeviceList() {
    const { devices, fetchDevices, addDevice, isLoading } = useStore();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [hasFetched, setHasFetched] = React.useState(false);

    // Add Device Form State
    const [isAddOpen, setIsAddOpen] = React.useState(false);
    const [newDeviceName, setNewDeviceName] = React.useState('');
    const [newDeviceUrl, setNewDeviceUrl] = React.useState('');
    const [newDeviceCrop, setNewDeviceCrop] = React.useState('');
    const [isFetchingData, setIsFetchingData] = React.useState(false);

    const handleAddDevice = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newDeviceName || !newDeviceUrl) {
            toast.error("Please provide both name and URL");
            return;
        }

        setIsFetchingData(true);
        try {
            // Step 1: Fetch data from the ESP8266 URL via backend proxy (bypasses CORS)
            const token = localStorage.getItem('auth_token');
            const proxyUrl = `http://localhost:3001/api/devices/proxy/fetch?url=${encodeURIComponent(newDeviceUrl)}`;
            
            const response = await fetch(proxyUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }).catch(() => null);
            
            let sensorData = {};

            if (response && response.ok) {
                sensorData = await response.json();
                toast.success("Successfully fetched data from device!");
            } else {
                const errorData = response ? await response.json().catch(() => ({})) : {};
                toast.warning(errorData.error || "Could not reach device URL, adding with default values.");
            }

            // Step 2: Add device to our database
            await addDevice({
                name: newDeviceName,
                webUrl: newDeviceUrl,
                crop: newDeviceCrop || "Unknown",
                status: 'online',
                healthScore: 100,
            });

            toast.success("Device added successfully!");
            setIsAddOpen(false);
            setNewDeviceName('');
            setNewDeviceUrl('');
            setNewDeviceCrop('');
        } catch (error) {
            console.error("Failed to add device:", error);
            toast.error("Failed to add device. Please try again.");
        } finally {
            setIsFetchingData(false);
        }
    };

    useEffect(() => {
        if (!hasFetched) {
            fetchDevices();
            setHasFetched(true);
        }
    }, [fetchDevices, hasFetched]);

    const filteredDevices = devices.filter(device =>
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (device.crop || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const onlineCount = devices.filter(d => d.status === 'online').length;
    const avgHealth = devices.length > 0
        ? Math.round(devices.reduce((a, d) => a + d.healthScore, 0) / devices.length)
        : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Device Fleet</h2>
                    <p className="text-muted-foreground mt-1">Manage and monitor all your aeroponic installations.</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl font-bold shadow-lg shadow-primary/20">
                            <Plus className="mr-2" size={20} />
                            Add Device
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-2xl border-none shadow-2xl bg-card/95 backdrop-blur-xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Add Aeroponic Device</DialogTitle>
                            <DialogDescription>
                                Enter your ESP8266 device details. We'll fetch live stats from its URL.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddDevice} className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Device Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Balcony Pod A"
                                    className="h-12 bg-background/50 border-none rounded-xl"
                                    value={newDeviceName}
                                    onChange={(e) => setNewDeviceName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="url" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Device Web URL</Label>
                                <Input
                                    id="url"
                                    placeholder="http://192.168.1.50/stats"
                                    className="h-12 bg-background/50 border-none rounded-xl"
                                    value={newDeviceUrl}
                                    onChange={(e) => setNewDeviceUrl(e.target.value)}
                                    required
                                    type="url"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="crop" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Crop Type</Label>
                                <Input
                                    id="crop"
                                    placeholder="e.g. Lettuce, Basil"
                                    className="h-12 bg-background/50 border-none rounded-xl"
                                    value={newDeviceCrop}
                                    onChange={(e) => setNewDeviceCrop(e.target.value)}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-12 rounded-xl font-bold text-lg shadow-lg shadow-primary/20"
                                disabled={isFetchingData}
                            >
                                {isFetchingData ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                        Connecting...
                                    </>
                                ) : (
                                    "Register Device"
                                )}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <Cpu size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase">Total Devices</p>
                            <h4 className="text-2xl font-bold">{devices.length}</h4>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                            <Activity size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase">Online Now</p>
                            <h4 className="text-2xl font-bold">{onlineCount}</h4>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                            <Leaf size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase">Avg Health</p>
                            <h4 className="text-2xl font-bold">{devices.length > 0 ? `${avgHealth}%` : '--'}</h4>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filter */}
            {devices.length > 0 && (
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input
                            placeholder="Search by name, ID, or crop..."
                            className="pl-10 h-11 bg-card border-none rounded-xl shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="rounded-xl h-11 border-none shadow-sm bg-card px-4">
                        <Filter className="mr-2" size={18} />
                        Filter
                    </Button>
                </div>
            )}

            {/* Empty State */}
            {devices.length === 0 && !isLoading && (
                <Card className="border-none shadow-sm">
                    <CardContent className="p-12 text-center">
                        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <Plus size={40} className="text-primary" />
                        </div>
                        <h3 className="text-xl font-bold">No Devices Connected</h3>
                        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                            Connect your first aeroponic pod to start monitoring temperature, humidity, pH, and nutrient levels in real-time.
                        </p>
                        <Button onClick={() => setIsAddOpen(true)} className="mt-6 rounded-xl font-bold">
                            <Plus className="mr-2" size={18} />
                            Add Your First Device
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Device Grid */}
            {filteredDevices.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDevices.map((device) => (
                        <Link key={device.id} to={`/device/${device.id}`} className="block group">
                            <Card className="border-none shadow-sm overflow-hidden transition-all hover:shadow-xl hover:scale-[1.02]">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                <Leaf size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold">{device.name}</h4>
                                                <p className="text-xs text-muted-foreground font-mono">{device.id.slice(0, 8)}...</p>
                                            </div>
                                        </div>
                                        <Badge className={cn(
                                            device.status === 'online' ? "bg-emerald-500" : "bg-muted text-muted-foreground"
                                        )}>
                                            {device.status}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-border/50">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Crop Type</span>
                                            <span className="font-medium">{device.crop || 'Not set'}</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Health Score</span>
                                                <span className="font-medium">{device.healthScore}%</span>
                                            </div>
                                            <Progress value={device.healthScore} className="h-2" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                        <span className="text-xs text-muted-foreground">View Details</span>
                                        <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {/* No search results */}
            {devices.length > 0 && filteredDevices.length === 0 && (
                <Card className="border-none shadow-sm">
                    <CardContent className="p-12 text-center">
                        <div className="w-16 h-16 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <Cpu size={32} className="text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-bold">No Devices Found</h3>
                        <p className="text-muted-foreground mt-2">No devices match your search criteria.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
