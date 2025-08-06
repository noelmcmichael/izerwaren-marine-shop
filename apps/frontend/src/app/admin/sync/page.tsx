'use client';

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';

import { useAuth } from '@/components/admin/AuthProvider';
import ProtectedRoute from '@/components/admin/ProtectedRoute';

interface SyncStatus {
  status: string;
  lastSync: string | null;
  nextScheduledSync: string;
  isRunning: boolean;
  progress: any | null;
}

interface SyncLog {
  id: string;
  operation: string;
  status: string;
  errorMessage?: string;
  syncedAt: string;
  product?: {
    title: string;
    handle: string;
  };
}

export default function SyncStatusPage() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'failed'>('all');
  const { getIdToken } = useAuth();

  useEffect(() => {
    fetchSyncStatus();
    fetchSyncLogs();
  }, []);

  const fetchSyncStatus = async () => {
    try {
      const token = await getIdToken();
      if (!token) return;

      const response = await fetch('/api/admin/sync', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data);
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
  };

  const fetchSyncLogs = async () => {
    try {
      const token = await getIdToken();
      if (!token) return;

      const response = await fetch(`/api/admin/sync/logs?failed=${logFilter === 'failed'}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSyncLogs(data.logs);
      }
    } catch (error) {
      console.error('Error fetching sync logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerManualSync = async () => {
    if (triggering) return;

    setTriggering(true);
    try {
      const token = await getIdToken();
      if (!token) return;

      // For demo purposes, using sample data
      const sampleData = [
        {
          sku: 'DEMO-001',
          title: 'Demo Product 1',
          description: 'Sample product for testing sync',
          vendor: 'Demo Vendor',
          product_type: 'Test',
          tags: ['demo', 'test'],
          price: 99.99,
          inventory_quantity: 100,
        },
      ];

      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jsonFeedData: sampleData }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Sync completed: ${result.summary.created} created, ${result.summary.updated} updated, ${result.summary.errors} errors`
        );
        fetchSyncStatus();
        fetchSyncLogs();
      } else {
        const error = await response.json();
        alert(`Sync failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
      alert('Failed to trigger sync');
    } finally {
      setTriggering(false);
    }
  };

  useEffect(() => {
    fetchSyncLogs();
  }, [logFilter]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className='animate-pulse'>
          <h1 className='text-2xl font-bold text-gray-900 mb-8'>Sync Status</h1>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <div className='bg-white p-6 rounded-lg shadow h-64'></div>
            <div className='bg-white p-6 rounded-lg shadow h-64'></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div>
        <h1 className='text-2xl font-bold text-gray-900 mb-8'>Sync Status</h1>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
          {/* Current Status */}
          <div className='bg-white p-6 rounded-lg shadow'>
            <h2 className='text-lg font-medium text-gray-900 mb-4'>Current Status</h2>

            <div className='space-y-4'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-500'>Status</span>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    syncStatus?.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : syncStatus?.status === 'running'
                        ? 'bg-blue-100 text-blue-800'
                        : syncStatus?.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {syncStatus?.status || 'idle'}
                </span>
              </div>

              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-500'>Last Sync</span>
                <span className='text-sm text-gray-900'>
                  {syncStatus?.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : 'Never'}
                </span>
              </div>

              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-500'>Next Scheduled</span>
                <span className='text-sm text-gray-900'>
                  {syncStatus?.nextScheduledSync
                    ? new Date(syncStatus.nextScheduledSync).toLocaleString()
                    : 'Not scheduled'}
                </span>
              </div>

              <div className='pt-4'>
                <button
                  onClick={triggerManualSync}
                  disabled={triggering || syncStatus?.isRunning}
                  className='w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {triggering ? (
                    <>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                      Triggering...
                    </>
                  ) : syncStatus?.isRunning ? (
                    'Sync in Progress...'
                  ) : (
                    '🔄 Trigger Manual Sync'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sync Statistics */}
          <div className='bg-white p-6 rounded-lg shadow'>
            <h2 className='text-lg font-medium text-gray-900 mb-4'>Sync Statistics</h2>

            <div className='space-y-4'>
              <div className='text-center p-4 bg-green-50 rounded-lg'>
                <div className='text-2xl font-bold text-green-600'>947</div>
                <div className='text-sm text-green-800'>Products Synced</div>
              </div>

              <div className='grid grid-cols-2 gap-4 text-center'>
                <div className='p-3 bg-blue-50 rounded-lg'>
                  <div className='text-lg font-bold text-blue-600'>0</div>
                  <div className='text-xs text-blue-800'>Today</div>
                </div>
                <div className='p-3 bg-orange-50 rounded-lg'>
                  <div className='text-lg font-bold text-orange-600'>0</div>
                  <div className='text-xs text-orange-800'>Errors</div>
                </div>
              </div>

              <div className='text-center text-sm text-gray-500'>
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Sync Logs */}
        <div className='bg-white shadow rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-lg leading-6 font-medium text-gray-900'>Sync Logs</h3>
              <div className='flex space-x-2'>
                <button
                  onClick={() => setLogFilter('all')}
                  className={`px-3 py-1 text-sm rounded ${
                    logFilter === 'all'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setLogFilter('failed')}
                  className={`px-3 py-1 text-sm rounded ${
                    logFilter === 'failed'
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Errors Only
                </button>
              </div>
            </div>

            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Operation
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Product
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Status
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Timestamp
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Error
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {syncLogs.map(log => (
                    <tr key={log.id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {log.operation}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {log.product?.title || 'N/A'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            log.status === 'SUCCESS'
                              ? 'bg-green-100 text-green-800'
                              : log.status === 'FAILED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {new Date(log.syncedAt).toLocaleString()}
                      </td>
                      <td className='px-6 py-4 text-sm text-red-600 max-w-xs truncate'>
                        {log.errorMessage || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {syncLogs.length === 0 && (
                <div className='text-center py-8'>
                  <div className='text-gray-500'>No sync logs found</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
