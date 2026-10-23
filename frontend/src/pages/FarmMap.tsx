import React, { useEffect, useState } from 'react';
import {
    MapPin,
    Leaf,
    Thermometer,
    Droplets,
    Activity,
    Info,
    Cloud,
    Wind,
    Navigation
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { getWeather, WeatherData, getCurrentLocation } from '@/services/weather';

// Fix Leaflet marker icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIconRetina,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    map.setView(center);
    return null;
}

export function FarmMap() {
    const { devices } = useStore();
    const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // Default to India center
    const [localWeather, setLocalWeather] = useState<WeatherData | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    useEffect(() => {
        handleAutoLocation();
    }, []);

    const handleAutoLocation = async () => {
        setIsLoadingLocation(true);
        try {
            const pos = await getCurrentLocation();
            const center: [number, number] = [pos.lat, pos.lng];
            setMapCenter(center);
            const weather = await getWeather(pos.lat, pos.lng);
            setLocalWeather(weather);
        } catch (error) {
            console.error('Failed to get auto-location:', error);
        } finally {
            setIsLoadingLocation(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Interactive Farm Map</h2>
                    <p className="text-muted-foreground mt-1">Real-time weather and device status across your installation zones.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAutoLocation}
                        disabled={isLoadingLocation}
                        className="rounded-xl"
                    >
                        <Navigation size={14} className={cn("mr-2", isLoadingLocation && "animate-spin")} />
                        Auto-locate
                    </Button>
                    <Badge variant="outline" className="font-mono text-xs hidden md:flex items-center">
                        <MapPin size={14} className="mr-1" />
                        {devices.length} Active Locations
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Map Section */}
                <Card className="lg:col-span-3 border-none shadow-sm overflow-hidden min-h-[600px] relative">
                    <CardContent className="p-0 h-full">
                        <MapContainer
                            center={mapCenter}
                            zoom={5}
                            className="h-[600px] w-full z-0"
                            scrollWheelZoom={true}
                        >
                            <ChangeView center={mapCenter} />
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {devices.map((device) => (
                                device.location && (
                                    <Marker
                                        key={device.id}
                                        position={[device.location.lat, device.location.lng]}
                                    >
                                        <Popup className="rounded-2xl">
                                            <div className="p-2 min-w-[200px]">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        device.status === 'online' ? "bg-emerald-500" : "bg-muted"
                                                    )} />
                                                    <h4 className="font-bold text-sm">{device.name}</h4>
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-4">{device.crop}</p>

                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    <div className="bg-muted/50 p-2 rounded-lg text-center">
                                                        <Activity size={12} className="mx-auto mb-1 text-primary" />
                                                        <p className="text-[10px] font-bold">{device.healthScore}%</p>
                                                    </div>
                                                    <Link
                                                        to={`/device/${device.id}`}
                                                        className="bg-primary text-primary-foreground p-2 rounded-lg text-center text-[10px] font-bold flex items-center justify-center"
                                                    >
                                                        Details
                                                    </Link>
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )
                            ))}
                        </MapContainer>
                    </CardContent>
                </Card>

                {/* Weather & Info Sidebar */}
                <div className="space-y-6">
                    {localWeather && (
                        <Card className="border-none shadow-sm bg-gradient-to-br from-primary/10 to-transparent">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Cloud className="text-primary" size={20} />
                                    Local Weather
                                </CardTitle>
                                <CardDescription>At your current location</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-bold">{Math.round(localWeather.temperature)}°C</span>
                                    <span className="text-muted-foreground pb-1">{localWeather.conditions}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Humidity</p>
                                        <div className="flex items-center gap-1">
                                            <Droplets size={14} className="text-blue-500" />
                                            <span className="text-sm font-bold">{localWeather.humidity}%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Wind Speed</p>
                                        <div className="flex items-center gap-1">
                                            <Wind size={14} className="text-amber-500" />
                                            <span className="text-sm font-bold">{localWeather.windSpeed} km/h</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-none shadow-sm bg-primary/5">
                        <CardContent className="p-6 flex items-start gap-4">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <Info size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Real-time Sync</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Weather data is fetched from Open-Meteo and synchronizes every 15 minutes.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase text-muted-foreground px-2">Active Locations</h4>
                        {devices.map(device => (
                            <Link key={device.id} to={`/device/${device.id}`}>
                                <Card className="border-none shadow-sm hover:translate-x-1 transition-transform mb-2">
                                    <CardContent className="p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                                device.status === 'online' ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                                            )}>
                                                <Leaf size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{device.name}</p>
                                                <p className="text-[10px] font-mono text-muted-foreground">{device.id.slice(0, 8)}...</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] h-5 px-1 bg-muted/50">
                                            {device.healthScore}%
                                        </Badge>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
