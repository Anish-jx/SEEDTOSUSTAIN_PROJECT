import React, { useEffect, useState } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Search,
  RefreshCw,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore } from '@/store/useStore';

export function AlertsCenter() {
  const { alerts, fetchAlerts, resolveAlert } = useStore();
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!hasFetched) {
      fetchAlerts();
      setHasFetched(true);
    }
  }, [fetchAlerts, hasFetched]);

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.deviceId || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' ||
      (filter === 'active' && !alert.resolved) ||
      (filter === 'resolved' && alert.resolved);
    return matchesSearch && matchesFilter;
  });

  const activeCount = alerts.filter(a => !a.resolved).length;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="text-rose-500" size={18} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={18} />;
      default: return <Info className="text-blue-500" size={18} />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const styles: Record<string, string> = {
      critical: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    };
    return styles[severity] || styles.info;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Incident Center</h2>
          <p className="text-muted-foreground mt-1">Monitor and resolve system anomalies and environmental alerts.</p>
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <Badge className="bg-rose-500 text-white px-4 py-1.5 text-sm font-bold">
              {activeCount} Active
            </Badge>
          )}
          <Button variant="outline" className="rounded-xl font-bold" onClick={() => fetchAlerts()}>
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Alerts"
          value={alerts.length.toString()}
          icon={Bell}
          color="primary"
        />
        <StatsCard
          title="Active Issues"
          value={activeCount.toString()}
          icon={AlertTriangle}
          color="rose"
        />
        <StatsCard
          title="Resolved"
          value={alerts.filter(a => a.resolved).length.toString()}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatsCard
          title="Response Time"
          value={alerts.length > 0 ? "~2h" : "--"}
          icon={Clock}
          color="blue"
        />
      </div>

      {/* Empty State */}
      {alerts.length === 0 && (
        <Card className="border-none shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={40} className="text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold">All Systems Operational</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              No alerts at this time. Your aeroponic installations are running smoothly.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters - only show if there are alerts */}
      {alerts.length > 0 && (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search by device or message..."
                className="pl-10 h-11 bg-card border-none rounded-xl shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2 bg-muted/30 p-1 rounded-xl">
              {(['all', 'active', 'resolved'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize",
                    filter === f
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Alert List */}
          <Card className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {filteredAlerts.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold">No Matching Alerts</h3>
                  <p className="text-muted-foreground mt-2">No alerts match your current filters.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        "p-6 flex items-start gap-4 transition-all hover:bg-muted/20",
                        !alert.resolved && "bg-muted/10"
                      )}
                    >
                      <div className="mt-0.5">
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className={cn("text-[10px] px-2 uppercase font-bold", getSeverityBadge(alert.severity))}>
                            {alert.severity}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] px-2 uppercase font-bold bg-muted/50">
                            {alert.category || 'System'}
                          </Badge>
                          {alert.deviceName && (
                            <span className="text-xs text-muted-foreground">{alert.deviceName}</span>
                          )}
                        </div>
                        <p className="font-medium text-sm">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        {alert.resolved ? (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                            <CheckCircle2 size={12} className="mr-1" />
                            Resolved
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            className="rounded-xl font-bold"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, color }: any) {
  const colors: Record<string, string> = {
    primary: 'text-primary bg-primary/10',
    rose: 'text-rose-500 bg-rose-500/10',
    emerald: 'text-emerald-500 bg-emerald-500/10',
    blue: 'text-blue-500 bg-blue-500/10',
  };

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
            <h4 className="text-2xl font-bold mt-2">{value}</h4>
          </div>
          <div className={cn("p-3 rounded-2xl", colors[color])}>
            <Icon size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
