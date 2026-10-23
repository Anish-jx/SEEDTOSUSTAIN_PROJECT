import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Leaf,
    LayoutDashboard,
    Map,
    Cpu,
    Activity,
    Bell,
    Settings,
    Zap,
    Menu,
    X,
    User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import logo from '@/assets/images/logo.png';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const NAV_ITEMS = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/devices', label: 'Devices', icon: Cpu },
    { path: '/map', label: 'Map', icon: Map },
    { path: '/analytics', label: 'Analytics', icon: Activity },
    { path: '/automation', label: 'Automation', icon: Zap },
    { path: '/alerts', label: 'Alerts', icon: Bell },
];

export function Header() {
    const location = useLocation();
    const { isMobileMenuOpen, setMobileMenuOpen, alerts } = useStore();
    const { user, logout } = useAuth();
    const unreadAlerts = alerts.filter(a => !a.resolved).length;

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <img src={logo} alt="Seed2Sustain" className="w-9 h-9 rounded-xl object-cover shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform" />
                        <span className="font-bold text-lg tracking-tight hidden sm:block">Seed2Sustain</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {NAV_ITEMS.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    <item.icon size={18} />
                                    <span>{item.label}</span>
                                    {item.path === '/alerts' && unreadAlerts > 0 && (
                                        <Badge className="ml-1 h-5 px-1.5 bg-rose-500 border-none">{unreadAlerts}</Badge>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Section */}
                    <div className="flex items-center gap-4">
                        <Link to="/settings">
                            <Button variant="ghost" size="icon" className="rounded-xl">
                                <Settings size={20} />
                            </Button>
                        </Link>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-9 w-9 rounded-xl">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={`https://avatar.vercel.sh/${user?.email}`} />
                                        <AvatarFallback>{user?.displayName?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">{user?.displayName || 'User'}</p>
                                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link to="/settings">Profile Settings</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={logout} className="text-rose-500">
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Mobile Menu Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden rounded-xl"
                            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t bg-background/95 backdrop-blur-xl animate-in slide-in-from-top-2">
                    <nav className="p-4 space-y-2">
                        {NAV_ITEMS.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                                        isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    <item.icon size={20} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            )}
        </header>
    );
}
