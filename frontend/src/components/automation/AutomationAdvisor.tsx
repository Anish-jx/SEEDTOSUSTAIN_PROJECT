import React, { useState, useEffect } from 'react';
import {
    Wand2,
    AlertCircle,
    AlertTriangle,
    Droplets,
    Thermometer,
    Sun,
    CheckCircle2,
    Info,
    ChevronRight,
    Zap,
    RefreshCw,
    Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { AIService, AISuggestion } from '@/services/ai';

// Local fallback interface removed, using AISuggestion from service

export function AutomationAdvisor() {
    const { devices, addRule } = useStore();
    const [selectedDevice, setSelectedDevice] = useState(devices[0]?.id || '');
    const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [applyingId, setApplyingId] = useState<string | null>(null);

    const device = devices.find(d => d.id === selectedDevice);

    const fetchAdvice = async () => {
        if (!device) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const advice = await AIService.getAutomationAdvice(device);
            setSuggestions(advice);
            if (advice.length === 0) {
                setError('No suggestions available. Make sure Ollama is running.');
            }
        } catch (err: any) {
            console.error('Failed to fetch AI advice:', err);
            setError(err.message || 'Failed to get AI recommendations. Check if Ollama is running.');
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAdvice();
    }, [device]);

    const handleApplyRoutine = async (suggestion: AISuggestion, index: number) => {
        if (!device) return;

        setApplyingId(`suggestion-${index}`);
        try {
            // Create automation rules from the suggestion
            const rules = [];
            
            // Create rule for misting
            if (suggestion.routine.mist) {
                rules.push({
                    name: `${suggestion.title} - Misting`,
                    deviceId: device.id,
                    condition: 'humidity',
                    operator: 'below',
                    threshold: 60,
                    action: `Apply misting: ${suggestion.routine.mist}`,
                    category: 'humidity',
                    priority: 'medium' as const,
                });
            }

            // Create rule for nutrients
            if (suggestion.routine.nutrient) {
                rules.push({
                    name: `${suggestion.title} - Nutrients`,
                    deviceId: device.id,
                    condition: 'ec',
                    operator: 'below',
                    threshold: 1.2,
                    action: `Apply nutrients: ${suggestion.routine.nutrient}`,
                    category: 'nutrients',
                    priority: 'medium' as const,
                });
            }

            // Create rule for lighting
            if (suggestion.routine.light) {
                rules.push({
                    name: `${suggestion.title} - Lighting`,
                    deviceId: device.id,
                    condition: 'lightLevel',
                    operator: 'below',
                    threshold: 5000,
                    action: `Set lighting: ${suggestion.routine.light}`,
                    category: 'schedule',
                    priority: 'low' as const,
                });
            }

            // Add all rules
            for (const rule of rules) {
                await addRule(rule);
            }

            // Show success message
            const { toast } = await import('sonner');
            toast.success(`Applied ${rules.length} automation rule(s) from "${suggestion.title}"`);
        } catch (err: any) {
            console.error('Failed to apply routine:', err);
            const { toast } = await import('sonner');
            toast.error('Failed to create automation rules');
        } finally {
            setApplyingId(null);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-border/50 bg-primary/5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-primary rounded-xl text-primary-foreground shadow-lg shadow-primary/20">
                        <Zap size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold">Automation Advisor</h3>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-0.5">Seed2Sustain AI</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground px-1">Active Device Context</label>
                        <select
                            className="w-full h-10 rounded-xl bg-background border border-border/50 px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                            value={selectedDevice}
                            onChange={(e) => setSelectedDevice(e.target.value)}
                        >
                            {devices.map(d => (
                                <option key={d.id} value={d.id}>{d.name} ({d.crop})</option>
                            ))}
                        </select>
                    </div>

                    {device && (
                        <div className="flex gap-4 p-3 bg-background rounded-xl border border-border/50">
                            <div className="flex-1 text-center border-r border-border/50">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Health</p>
                                <p className={cn(
                                    "text-lg font-bold",
                                    device.healthScore > 80 ? "text-emerald-500" : "text-amber-500"
                                )}>{device.healthScore}%</p>
                            </div>
                            <div className="flex-1 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Crop</p>
                                <p className="text-sm font-bold truncate">{device.crop}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary">
                            <Wand2 size={16} />
                            <span className="text-xs font-bold uppercase">Smart Recommendations</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchAdvice}
                            disabled={isLoading || !device}
                            className="h-8 text-xs"
                        >
                            <RefreshCw size={14} className={cn("mr-1", isLoading && "animate-spin")} />
                            Refresh
                        </Button>
                    </div>

                    {isLoading && (
                        <Card className="border-none shadow-sm">
                            <CardContent className="p-8 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <Sparkles className="animate-pulse text-primary" size={32} />
                                    <p className="text-sm text-muted-foreground">AI is analyzing your device...</p>
                                    <p className="text-xs text-muted-foreground">This may take a few seconds</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {error && !isLoading && (
                        <Card className="border-none shadow-sm bg-rose-500/5 border-rose-500/20">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-rose-700">Error Loading Recommendations</p>
                                        <p className="text-xs text-rose-600 mt-1">{error}</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={fetchAdvice}
                                            className="mt-3 h-7 text-xs"
                                        >
                                            Try Again
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {!isLoading && !error && suggestions.length === 0 && device && (
                        <Card className="border-none shadow-sm">
                            <CardContent className="p-8 text-center">
                                <p className="text-sm text-muted-foreground">No recommendations available for this device.</p>
                            </CardContent>
                        </Card>
                    )}

                    {!isLoading && !error && suggestions.map((s, i) => (
                        <Card key={i} className="border-none shadow-sm bg-muted/30 overflow-hidden group hover:bg-muted/50 transition-colors">
                            <CardHeader className="p-4 pb-2">
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-sm font-bold">{s.title}</CardTitle>
                                    <Badge variant="outline" className="text-[8px] bg-background">AI SUGGEST</Badge>
                                </div>
                                <CardDescription className="text-xs">{s.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-2 space-y-4">
                                <div className="grid grid-cols-1 gap-2">
                                    {Object.entries(s.routine).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between p-2 bg-background rounded-lg text-[11px] border border-border/30">
                                            <div className="flex items-center gap-2 capitalize text-muted-foreground">
                                                {key === 'mist' && <Droplets size={12} />}
                                                {key === 'nutrient' && <Zap size={12} />}
                                                {key === 'light' && <Sun size={12} />}
                                                <span className="font-bold">{key}</span>
                                            </div>
                                            <span className="font-mono text-primary font-bold">{value}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-500/5 text-[10px] text-emerald-700 border border-emerald-500/10">
                                        <Info size={14} className="shrink-0 mt-0.5" />
                                        <p><span className="font-bold">Rationale:</span> {s.why}</p>
                                    </div>

                                    {s.warning && (
                                        <div className="flex items-start gap-2 p-2 rounded-lg bg-rose-500/5 text-[10px] text-rose-700 border border-rose-500/10">
                                            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                            <p><span className="font-bold">Warning:</span> {s.warning}</p>
                                        </div>
                                    )}
                                </div>

                                <Button 
                                    size="sm" 
                                    className="w-full rounded-xl text-[10px] h-8 font-bold group"
                                    onClick={() => handleApplyRoutine(s, i)}
                                    disabled={applyingId === `suggestion-${i}`}
                                >
                                    {applyingId === `suggestion-${i}` ? (
                                        <>
                                            <RefreshCw size={12} className="mr-1 animate-spin" />
                                            Applying...
                                        </>
                                    ) : (
                                        <>
                                            Apply Routine
                                            <ChevronRight size={12} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </ScrollArea>

            <div className="p-4 border-t border-border/50 bg-muted/20">
                <div className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border/50">
                    <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
                        <AlertCircle size={16} />
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-snug">
                        AI suggestions are based on standard botanical data. Always verify hardware capacity before applying high-frequency routines.
                    </p>
                </div>
            </div>
        </div>
    );
}

