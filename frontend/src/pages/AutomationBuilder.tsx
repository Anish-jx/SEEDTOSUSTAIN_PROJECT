import React, { useEffect, useState } from 'react';
import {
    Zap,
    Plus,
    Play,
    Pause,
    Trash2,
    Settings2,
    ChevronRight,
    Thermometer,
    Droplets,
    Clock,
    Search,
    Sparkles,
    ChevronLeft,
    X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AutomationAdvisor } from '@/components/automation/AutomationAdvisor';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function AutomationBuilder() {
    const { rules, fetchRules, toggleRule, deleteRule, addRule, devices } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [hasFetched, setHasFetched] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newRule, setNewRule] = useState({
        name: '',
        deviceId: 'all',
        condition: 'airTemp',
        operator: 'above',
        threshold: '25',
        action: '',
        category: 'climate',
        priority: 'medium' as const,
    });

    useEffect(() => {
        if (!hasFetched) {
            fetchRules();
            setHasFetched(true);
        }
    }, [fetchRules, hasFetched]);

    const filteredRules = rules.filter(rule =>
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rule.deviceId || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleToggle = async (id: string, enabled: boolean) => {
        try {
            await toggleRule(id, enabled);
            toast.success(`Rule ${enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            toast.error('Failed to update rule');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteRule(id);
            toast.success('Rule deleted');
        } catch (error) {
            toast.error('Failed to delete rule');
        }
    };

    const handleCreateRule = async () => {
        if (!newRule.name || !newRule.action) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsCreating(true);
        try {
            await addRule({
                ...newRule,
                threshold: parseFloat(newRule.threshold) || 0,
                deviceId: newRule.deviceId === 'all' ? 'all' : newRule.deviceId,
            });
            toast.success('Rule created successfully');
            setIsCreateDialogOpen(false);
            setNewRule({
                name: '',
                deviceId: 'all',
                condition: 'airTemp',
                operator: 'above',
                threshold: '25',
                action: '',
                category: 'climate',
                priority: 'medium',
            });
        } catch (error) {
            console.error('Failed to create rule:', error);
            toast.error('Failed to create rule');
        } finally {
            setIsCreating(false);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'climate': return Thermometer;
            case 'humidity': return Droplets;
            case 'schedule': return Clock;
            default: return Zap;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-muted';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Automation Engine</h2>
                    <p className="text-muted-foreground mt-1">Create intelligent rules to automate your growing environment.</p>
                </div>
                <div className="flex gap-3">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="rounded-xl font-bold border-primary text-primary hover:bg-primary/5">
                                <Sparkles className="mr-2" size={20} />
                                AI Advisor
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="p-0 sm:max-w-[400px]">
                            <SheetHeader className="sr-only">
                                <SheetTitle>AI Automation Advisor</SheetTitle>
                                <SheetDescription>
                                    Get AI-powered recommendations for optimizing your aeroponic device automation rules.
                                </SheetDescription>
                            </SheetHeader>
                            <AutomationAdvisor />
                        </SheetContent>
                    </Sheet>
                    <Button 
                        className="rounded-xl font-bold shadow-lg shadow-primary/20"
                        onClick={() => setIsCreateDialogOpen(true)}
                    >
                        <Plus className="mr-2" size={20} />
                        New Rule
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <Zap size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase">Total Rules</p>
                            <h4 className="text-2xl font-bold">{rules.length}</h4>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                            <Play size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase">Active</p>
                            <h4 className="text-2xl font-bold">{rules.filter(r => r.enabled).length}</h4>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                            <Pause size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase">Paused</p>
                            <h4 className="text-2xl font-bold">{rules.filter(r => !r.enabled).length}</h4>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Empty State */}
            {rules.length === 0 && (
                <Card className="border-none shadow-sm">
                    <CardContent className="p-12 text-center">
                        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <Zap size={40} className="text-primary" />
                        </div>
                        <h3 className="text-xl font-bold">No Automation Rules</h3>
                        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                            Create your first automation rule to automatically respond to environmental changes. Set up alerts, trigger actions, and optimize your growing conditions.
                        </p>
                        <Button 
                            className="mt-6 rounded-xl font-bold"
                            onClick={() => setIsCreateDialogOpen(true)}
                        >
                            <Plus className="mr-2" size={18} />
                            Create Your First Rule
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Search - only show if there are rules */}
            {rules.length > 0 && (
                <>
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <Input
                                placeholder="Search by name or device..."
                                className="pl-10 h-11 bg-card border-none rounded-xl shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Rules List */}
                    <div className="space-y-4">
                        {filteredRules.map((rule) => {
                            const Icon = getCategoryIcon(rule.category);
                            return (
                                <Card key={rule.id} className="border-none shadow-sm overflow-hidden">
                                    <CardContent className="p-0">
                                        <div className="flex items-center gap-6 p-6">
                                            <div className={cn(
                                                "p-3 rounded-2xl",
                                                rule.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                            )}>
                                                <Icon size={24} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-bold">{rule.name}</h4>
                                                    <Badge variant="outline" className={cn("text-[10px] px-2 uppercase font-bold", getPriorityColor(rule.priority))}>
                                                        {rule.priority}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    When <span className="font-mono text-foreground">{rule.condition}</span>{' '}
                                                    <span className="font-mono text-foreground">{rule.operator}</span>{' '}
                                                    <span className="font-mono text-foreground">{rule.threshold}</span>{' '}
                                                    → {rule.action}
                                                </p>
                                                {rule.lastTriggered && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Last triggered: {rule.lastTriggered}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <Switch
                                                    checked={rule.enabled}
                                                    onCheckedChange={(checked) => handleToggle(rule.id, checked)}
                                                />
                                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                                    <Settings2 size={18} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground hover:text-rose-500"
                                                    onClick={() => handleDelete(rule.id)}
                                                >
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* No search results */}
                    {filteredRules.length === 0 && rules.length > 0 && (
                        <Card className="border-none shadow-sm">
                            <CardContent className="p-12 text-center">
                                <p className="text-muted-foreground">No rules match your search criteria.</p>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {/* Create Rule Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Create Automation Rule</DialogTitle>
                        <DialogDescription>
                            Set up a rule to automatically respond to environmental changes.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="rule-name">Rule Name *</Label>
                            <Input
                                id="rule-name"
                                placeholder="e.g., High Temperature Alert"
                                value={newRule.name}
                                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="device">Device</Label>
                                <Select
                                    value={newRule.deviceId}
                                    onValueChange={(value) => setNewRule({ ...newRule, deviceId: value })}
                                >
                                    <SelectTrigger id="device">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Devices</SelectItem>
                                        {devices.map((d) => (
                                            <SelectItem key={d.id} value={d.id}>
                                                {d.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={newRule.category}
                                    onValueChange={(value) => setNewRule({ ...newRule, category: value })}
                                >
                                    <SelectTrigger id="category">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="climate">Climate</SelectItem>
                                        <SelectItem value="humidity">Humidity</SelectItem>
                                        <SelectItem value="nutrients">Nutrients</SelectItem>
                                        <SelectItem value="schedule">Schedule</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="condition">Condition</Label>
                                <Select
                                    value={newRule.condition}
                                    onValueChange={(value) => setNewRule({ ...newRule, condition: value })}
                                >
                                    <SelectTrigger id="condition">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="airTemp">Air Temperature</SelectItem>
                                        <SelectItem value="rootTemp">Root Temperature</SelectItem>
                                        <SelectItem value="humidity">Humidity</SelectItem>
                                        <SelectItem value="ph">pH Level</SelectItem>
                                        <SelectItem value="ec">EC Level</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="operator">Operator</Label>
                                <Select
                                    value={newRule.operator}
                                    onValueChange={(value) => setNewRule({ ...newRule, operator: value })}
                                >
                                    <SelectTrigger id="operator">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="above">Above</SelectItem>
                                        <SelectItem value="below">Below</SelectItem>
                                        <SelectItem value="equals">Equals</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="threshold">Threshold</Label>
                                <Input
                                    id="threshold"
                                    type="number"
                                    step="0.1"
                                    placeholder="25"
                                    value={newRule.threshold}
                                    onChange={(e) => setNewRule({ ...newRule, threshold: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="action">Action *</Label>
                            <Input
                                id="action"
                                placeholder="e.g., Turn on cooling fan"
                                value={newRule.action}
                                onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select
                                value={newRule.priority}
                                onValueChange={(value: 'low' | 'medium' | 'high') => setNewRule({ ...newRule, priority: value })}
                            >
                                <SelectTrigger id="priority">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCreateDialogOpen(false)}
                            disabled={isCreating}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateRule}
                            disabled={isCreating || !newRule.name || !newRule.action}
                        >
                            {isCreating ? 'Creating...' : 'Create Rule'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
