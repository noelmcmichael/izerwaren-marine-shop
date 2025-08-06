'use client';

import { formatDate } from '../../lib/types';
import { useState, useEffect } from 'react';

interface SystemStatusProps {
  className?: string;
}

interface HealthStatus {
  status: string;
  timestamp: string;
  service: string;
}

export default function SystemStatus({ className = '' }: SystemStatusProps) {
  const [backendStatus, setBackendStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/health');

        if (!response.ok) {
          throw new Error(`Backend responded with status: ${response.status}`);
        }

        const data: HealthStatus = await response.json();
        setBackendStatus(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setBackendStatus(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (error) return 'border-red-200 bg-red-50';
    if (backendStatus?.status === 'healthy') return 'border-green-200 bg-green-50';
    return 'border-yellow-200 bg-yellow-50';
  };

  const getStatusIcon = () => {
    if (isLoading) return '⏳';
    if (error) return '❌';
    if (backendStatus?.status === 'healthy') return '✅';
    return '⚠️';
  };

  return (
    <div className={`p-4 border rounded-lg ${getStatusColor()} ${className}`}>
      <div className='flex items-center justify-between mb-2'>
        <h3 className='font-medium text-gray-800'>{getStatusIcon()} System Status</h3>
        <span className='text-sm text-gray-600'>{isLoading ? 'Checking...' : 'Live'}</span>
      </div>

      <div className='space-y-2 text-sm'>
        <div className='flex justify-between'>
          <span className='text-gray-600'>Frontend:</span>
          <span className='font-medium text-green-600'>✅ Running (Next.js 14)</span>
        </div>

        <div className='flex justify-between'>
          <span className='text-gray-600'>Backend API:</span>
          {isLoading ? (
            <span className='text-yellow-600'>⏳ Checking...</span>
          ) : error ? (
            <span className='font-medium text-red-600'>❌ {error}</span>
          ) : (
            <span className='font-medium text-green-600'>
              ✅ {backendStatus?.service || 'Healthy'}
            </span>
          )}
        </div>

        <div className='flex justify-between'>
          <span className='text-gray-600'>Monorepo:</span>
          <span className='font-medium text-green-600'>✅ Packages Linked</span>
        </div>

        {backendStatus && (
          <div className='pt-2 border-t border-gray-200'>
            <span className='text-xs text-gray-500'>
              Last check: {formatDate(new Date(backendStatus.timestamp))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
