'use client';

import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

/**
 * Production Monitoring Dashboard
 * 
 * Real-time monitoring dashboard for system health, performance metrics,
 * and business analytics
 */

interface DashboardData {
  title: string;
  lastUpdated: string;
  widgets: Widget[];
  config: {
    refreshInterval: number;
    timezone: string;
    theme: string;
  };
  correlationId: string;
  timestamp: string;
}

interface Widget {
  id: string;
  title: string;
  type: 'status' | 'metric' | 'chart' | 'list' | 'metrics-grid' | 'alerts';
  data: any;
  position: { x: number; y: number; w: number; h: number };
}

interface MetricValue {
  value: number;
  unit: string;
  trend?: number;
  threshold?: number;
  status?: 'good' | 'warning' | 'critical';
}

export default function MonitoringDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/monitoring/dashboard');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status}`);
      }

      const data = await response.json();
      setDashboardData(data);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh setup
  useEffect(() => {
    fetchDashboardData();

    if (autoRefresh && dashboardData?.config.refreshInterval) {
      const interval = setInterval(fetchDashboardData, dashboardData.config.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, dashboardData?.config.refreshInterval]);

  // Manual refresh
  const handleRefresh = () => {
    setLoading(true);
    fetchDashboardData();
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {dashboardData?.title || 'Monitoring Dashboard'}
            </h1>
            <p className="text-gray-400 text-sm">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-300">Auto-refresh</span>
            </label>
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Grid */}
      <main className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {dashboardData?.widgets.map((widget) => (
            <div
              key={widget.id}
              className={`col-span-${widget.position.w} bg-gray-800 rounded-lg border border-gray-700 p-4`}
              style={{
                gridColumn: `span ${widget.position.w}`,
                minHeight: `${widget.position.h * 120}px`,
              }}
            >
              <WidgetRenderer widget={widget} />
            </div>
          ))}
        </div>
      </main>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-200 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function WidgetRenderer({ widget }: { widget: Widget }) {
  switch (widget.type) {
    case 'status':
      return <StatusWidget widget={widget} />;
    case 'metric':
      return <MetricWidget widget={widget} />;
    case 'chart':
      return <ChartWidget widget={widget} />;
    case 'list':
      return <ListWidget widget={widget} />;
    case 'metrics-grid':
      return <MetricsGridWidget widget={widget} />;
    case 'alerts':
      return <AlertsWidget widget={widget} />;
    default:
      return <div className="text-gray-400">Unknown widget type: {widget.type}</div>;
  }
}

function StatusWidget({ widget }: { widget: Widget }) {
  const { status, uptime, version } = widget.data;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'unhealthy': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-6 w-6 text-green-400" />;
      case 'degraded': return <AlertTriangle className="h-6 w-6 text-yellow-400" />;
      case 'unhealthy': return <AlertTriangle className="h-6 w-6 text-red-400" />;
      default: return <Activity className="h-6 w-6 text-gray-400" />;
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{widget.title}</h3>
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon(status)}
          <span className={`text-xl font-bold capitalize ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
        
        <div className="text-sm text-gray-400 space-y-1">
          <div>Uptime: {uptime}</div>
          <div>Version: {version}</div>
        </div>
      </div>
    </div>
  );
}

function MetricWidget({ widget }: { widget: Widget }) {
  const { value, unit, trend, threshold, status } = widget.data as MetricValue;
  
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'good': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{widget.title}</h3>
      <div className="space-y-2">
        <div className={`text-3xl font-bold ${getStatusColor(status)}`}>
          {value.toLocaleString()} {unit}
        </div>
        
        {trend !== undefined && (
          <div className="flex items-center space-x-1">
            {trend > 0 ? (
              <TrendingUp className="h-4 w-4 text-red-400" />
            ) : trend < 0 ? (
              <TrendingDown className="h-4 w-4 text-green-400" />
            ) : null}
            <span className={`text-sm ${trend > 0 ? 'text-red-400' : trend < 0 ? 'text-green-400' : 'text-gray-400'}`}>
              {trend > 0 ? '+' : ''}{Math.abs(trend)} {unit}
            </span>
          </div>
        )}
        
        {threshold && (
          <div className="text-xs text-gray-500">
            Threshold: {threshold} {unit}
          </div>
        )}
      </div>
    </div>
  );
}

function ChartWidget({ widget }: { widget: Widget }) {
  // Simplified chart representation
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{widget.title}</h3>
      <div className="h-40 bg-gray-700 rounded flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Activity className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Chart visualization</p>
          <p className="text-xs">({widget.data.type} chart)</p>
        </div>
      </div>
    </div>
  );
}

function ListWidget({ widget }: { widget: Widget }) {
  const { items } = widget.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{widget.title}</h3>
      <div className="space-y-3">
        {items.map((item: any, index: number) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`} />
              <span className="text-gray-300">{item.name}</span>
            </div>
            <div className="text-sm text-gray-400">
              {item.responseTime}ms
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricsGridWidget({ widget }: { widget: Widget }) {
  const { metrics } = widget.data;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{widget.title}</h3>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric: any, index: number) => (
          <div key={index} className="bg-gray-700 p-3 rounded">
            <div className="text-sm text-gray-400 mb-1">{metric.label}</div>
            <div className="text-xl font-bold text-white">{metric.value.toLocaleString()}</div>
            {metric.change !== undefined && (
              <div className="flex items-center space-x-1 mt-1">
                {metric.change > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-400" />
                ) : metric.change < 0 ? (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                ) : null}
                <span className={`text-xs ${metric.change > 0 ? 'text-green-400' : metric.change < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                  {metric.change > 0 ? '+' : ''}{metric.change}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertsWidget({ widget }: { widget: Widget }) {
  const { alerts } = widget.data;

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-l-red-500 bg-red-900/20';
      case 'warning': return 'border-l-yellow-500 bg-yellow-900/20';
      case 'info': return 'border-l-blue-500 bg-blue-900/20';
      default: return 'border-l-gray-500 bg-gray-900/20';
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{widget.title}</h3>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center text-gray-400 py-4">
            <CheckCircle className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm">No alerts</p>
          </div>
        ) : (
          alerts.map((alert: any) => (
            <div key={alert.id} className={`border-l-4 p-3 rounded ${getAlertColor(alert.type)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">
                    {alert.message}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
                {alert.resolved && (
                  <div className="text-green-400 text-xs ml-2">Resolved</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}