'use client';

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';

import AdminLayout from '@/components/admin/AdminLayout';

interface DashboardStats {
  dealers: {
    total: number;
    active: number;
    newThisWeek: number;
  };
  rfq: {
    pending: number;
    thisWeek: number;
  };
}

export default function AdminDevPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch dealers
      const dealersResponse = await fetch('/api/admin/dealers');
      const dealersData = await dealersResponse.json();

      // Calculate stats
      const dealerStats = {
        total: dealersData.dealers?.length || 0,
        active: dealersData.dealers?.filter((d: any) => d.isActive).length || 0,
        newThisWeek: 0, // Could calculate based on createdAt
      };

      setStats({
        dealers: dealerStats,
        rfq: {
          pending: 1, // From seeded data
          thisWeek: 1,
        },
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center min-h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600'></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='space-y-6'>
        {/* Header */}
        <div className='bg-white shadow rounded-lg p-6'>
          <h1 className='text-2xl font-bold text-gray-900'>🚧 Development Dashboard</h1>
          <p className='mt-2 text-gray-600'>
            Authentication bypassed - Direct access to admin features
          </p>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {/* Dealers */}
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center'>
                    <span className='text-white text-sm font-medium'>👥</span>
                  </div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Total Dealers</dt>
                    <dd className='text-lg font-medium text-gray-900'>
                      {stats?.dealers.total || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Active Dealers */}
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center'>
                    <span className='text-white text-sm font-medium'>✅</span>
                  </div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Active Dealers</dt>
                    <dd className='text-lg font-medium text-gray-900'>
                      {stats?.dealers.active || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Pending RFQs */}
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center'>
                    <span className='text-white text-sm font-medium'>📋</span>
                  </div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Pending RFQs</dt>
                    <dd className='text-lg font-medium text-gray-900'>{stats?.rfq.pending || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Health Status */}
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center'>
                    <span className='text-white text-sm font-medium'>🔧</span>
                  </div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Dev Mode</dt>
                    <dd className='text-lg font-medium text-gray-900'>Active</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='bg-white shadow rounded-lg p-6'>
          <h2 className='text-lg font-medium text-gray-900 mb-4'>Quick Actions</h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <a
              href='/admin/dealers'
              className='inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
            >
              <span className='mr-2'>👥</span>
              Manage Dealers
            </a>
            <a
              href='/admin/sync'
              className='inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
            >
              <span className='mr-2'>🔄</span>
              Sync Status
            </a>
            <a
              href='/api/health'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
            >
              <span className='mr-2'>🩺</span>
              Health Check
            </a>
          </div>
        </div>

        {/* Development Info */}
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-6'>
          <h3 className='text-sm font-medium text-yellow-800 mb-2'>Development Mode Active</h3>
          <div className='text-sm text-yellow-700 space-y-1'>
            <p>• Authentication bypassed for testing</p>
            <p>• Database operations fully functional</p>
            <p>• External services (Firebase, Shopify) are mocked</p>
            <p>• Sample data is available for testing</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
