import { Metadata } from 'next';
import MonitoringDashboard from '../../components/monitoring/dashboard';

export const metadata: Metadata = {
  title: 'Production Monitoring - Izerwaren',
  description: 'Real-time production monitoring dashboard',
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Monitoring Dashboard Page
 * 
 * Provides access to the production monitoring dashboard for system health,
 * performance metrics, and business analytics
 */

export default function MonitoringPage() {
  return <MonitoringDashboard />;
}

// Optional: Add dynamic behavior for authentication checks
export const dynamic = 'force-dynamic';