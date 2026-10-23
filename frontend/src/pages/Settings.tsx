import React, { useState, useEffect } from 'react';
import {
    User,
    Bell,
    Shield,
    Palette,
    Moon,
    Sun,
    Save,
    Mail,
    Phone,
    Building2,
    Globe,
    Cpu,
    Layers
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function Settings() {
    const { user, updateUser } = useAuth();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        alerts: true,
        reports: false
    });
    const [iotSetupType, setIotSetupType] = useState<string>((user as any)?.iotSetupType || 'single');
    
    useEffect(() => {
        if (user && (user as any).iotSetupType) {
            setIotSetupType((user as any).iotSetupType);
        }
    }, [user]);
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveIoT = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://localhost:3001/api/auth/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ iotSetupType }),
            });

            if (response.ok) {
                const updatedUser = await response.json();
                if (updateUser) updateUser(updatedUser);
                toast.success('IoT configuration saved successfully');
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Failed to save IoT config:', error);
            toast.error('Failed to save IoT configuration');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground mt-1">Manage your account preferences and application settings.</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-muted/30 p-1 rounded-2xl border-none">
                    <TabsTrigger value="profile" className="rounded-xl px-6 py-2">
                        <User size={16} className="mr-2" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="rounded-xl px-6 py-2">
                        <Bell size={16} className="mr-2" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="rounded-xl px-6 py-2">
                        <Palette size={16} className="mr-2" />
                        Appearance
                    </TabsTrigger>
                    <TabsTrigger value="security" className="rounded-xl px-6 py-2">
                        <Shield size={16} className="mr-2" />
                        Security
                    </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your personal details and contact information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="displayName">Display Name</Label>
                                    <Input
                                        id="displayName"
                                        defaultValue={user?.displayName || ''}
                                        className="h-11 rounded-xl bg-muted/30 border-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                        <Input
                                            id="email"
                                            type="email"
                                            defaultValue={user?.email || ''}
                                            className="h-11 rounded-xl bg-muted/30 border-none pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="+1 (555) 000-0000"
                                            className="h-11 rounded-xl bg-muted/30 border-none pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="organization">Organization</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                        <Input
                                            id="organization"
                                            placeholder="Your farm or company"
                                            className="h-11 rounded-xl bg-muted/30 border-none pl-10"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label htmlFor="timezone">Timezone</Label>
                                <Select defaultValue="utc+5:30">
                                    <SelectTrigger className="w-full md:w-64 h-11 rounded-xl bg-muted/30 border-none">
                                        <Globe size={18} className="mr-2 text-muted-foreground" />
                                        <SelectValue placeholder="Select timezone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="utc+5:30">IST (UTC+5:30)</SelectItem>
                                        <SelectItem value="utc+0">GMT (UTC+0)</SelectItem>
                                        <SelectItem value="utc-5">EST (UTC-5)</SelectItem>
                                        <SelectItem value="utc-8">PST (UTC-8)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex justify-end">
                                <Button className="rounded-xl font-bold" onClick={handleSave}>
                                    <Save size={18} className="mr-2" />
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                            <CardDescription>Configure how you receive alerts and updates.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                                    <div>
                                        <h4 className="font-medium">Email Notifications</h4>
                                        <p className="text-sm text-muted-foreground">Receive alerts via email</p>
                                    </div>
                                    <Switch
                                        checked={notifications.email}
                                        onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                                    <div>
                                        <h4 className="font-medium">Push Notifications</h4>
                                        <p className="text-sm text-muted-foreground">Browser push notifications</p>
                                    </div>
                                    <Switch
                                        checked={notifications.push}
                                        onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                                    <div>
                                        <h4 className="font-medium">Critical Alerts</h4>
                                        <p className="text-sm text-muted-foreground">Immediate alerts for critical issues</p>
                                    </div>
                                    <Switch
                                        checked={notifications.alerts}
                                        onCheckedChange={(checked) => setNotifications({ ...notifications, alerts: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                                    <div>
                                        <h4 className="font-medium">Weekly Reports</h4>
                                        <p className="text-sm text-muted-foreground">Summary reports every week</p>
                                    </div>
                                    <Switch
                                        checked={notifications.reports}
                                        onCheckedChange={(checked) => setNotifications({ ...notifications, reports: checked })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button className="rounded-xl font-bold" onClick={handleSave}>
                                    <Save size={18} className="mr-2" />
                                    Save Preferences
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Appearance Tab */}
                <TabsContent value="appearance" className="space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Appearance</CardTitle>
                            <CardDescription>Customize the look and feel of the application.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    {isDarkMode ? <Moon size={24} /> : <Sun size={24} />}
                                    <div>
                                        <h4 className="font-medium">Dark Mode</h4>
                                        <p className="text-sm text-muted-foreground">Toggle dark theme</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={isDarkMode}
                                    onCheckedChange={(checked) => {
                                        setIsDarkMode(checked);
                                        document.documentElement.classList.toggle('dark', checked);
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Security Settings</CardTitle>
                            <CardDescription>Manage your password and account security.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Current Password</Label>
                                    <Input
                                        id="currentPassword"
                                        type="password"
                                        className="h-11 rounded-xl bg-muted/30 border-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        className="h-11 rounded-xl bg-muted/30 border-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        className="h-11 rounded-xl bg-muted/30 border-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button className="rounded-xl font-bold" onClick={handleSave}>
                                    <Save size={18} className="mr-2" />
                                    Update Password
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* IoT Setup Tab */}
                <TabsContent value="iot" className="space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Cpu size={20} />
                                IoT Device Configuration
                            </CardTitle>
                            <CardDescription>
                                Configure how your IoT devices are set up. Choose whether you have one device per pod or one device managing multiple pods.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <Label htmlFor="iotSetupType">IoT Setup Type</Label>
                                <Select
                                    value={iotSetupType}
                                    onValueChange={setIotSetupType}
                                >
                                    <SelectTrigger id="iotSetupType" className="h-11 rounded-xl bg-muted/30 border-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="single">
                                            <div className="flex flex-col">
                                                <span className="font-bold">Single Device</span>
                                                <span className="text-xs text-muted-foreground">One IoT device per pod</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="multiple">
                                            <div className="flex flex-col">
                                                <span className="font-bold">Multiple Pods</span>
                                                <span className="text-xs text-muted-foreground">One IoT device managing multiple pods</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="both">
                                            <div className="flex flex-col">
                                                <span className="font-bold">Both</span>
                                                <span className="text-xs text-muted-foreground">Mix of single and multi-pod setups</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="p-4 bg-muted/30 rounded-xl space-y-2">
                                    <div className="flex items-start gap-2">
                                        <Layers size={16} className="text-primary mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm font-bold">Current Setup: {iotSetupType === 'single' ? 'Single Device' : iotSetupType === 'multiple' ? 'Multiple Pods' : 'Both'}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {iotSetupType === 'single' && 'Each pod has its own dedicated IoT device. Ideal for independent monitoring.'}
                                                {iotSetupType === 'multiple' && 'One IoT device monitors multiple pods in the same location. More cost-effective for similar setups.'}
                                                {iotSetupType === 'both' && 'You have a mix of setups - some pods have dedicated devices, others share devices.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex justify-end">
                                <Button 
                                    className="rounded-xl font-bold" 
                                    onClick={handleSaveIoT}
                                    disabled={isSaving || iotSetupType === (user?.iotSetupType || 'single')}
                                >
                                    <Save size={18} className="mr-2" />
                                    {isSaving ? 'Saving...' : 'Save Configuration'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
