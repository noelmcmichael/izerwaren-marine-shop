'use client';

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';

import { useAuth } from '@/components/admin/AuthProvider';
import ProtectedRoute from '@/components/admin/ProtectedRoute';

interface DashboardStats {
  dealers: {
    total: number;
    active: number;
    newThisWeek: number;
  };
  sync: {
    lastSync: string | null;
    status: string;
    errors: number;
  };
  pricing: {
    activeRules: number;
    expiringRules: number;
  };
  rfq: {
    pending: number;
    thisWeek: number;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { getIdToken } = useAuth();

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        const token = await getIdToken();
        if (!token) return;

        // For now, using mock data since we haven't implemented stats endpoints
        // TODO: Replace with actual API calls in next iteration
        const mockStats: DashboardStats = {
          dealers: {
            total: 24,
            active: 22,
            newThisWeek: 3,
          },
          sync: {
            lastSync: '2025-01-30T02:00:00Z',
            status: 'completed',
            errors: 0,
          },
          pricing: {
            activeRules: 156,
            expiringRules: 8,
          },
          rfq: {
            pending: 7,
            thisWeek: 12,
          },
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setStats(mockStats);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardStats();
  }, [getIdToken]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className='animate-pulse'>
          <h1 className='text-2xl font-bold text-gray-900 mb-8'>Dashboard</h1>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {[...Array(4)].map((_, i) => (
              <div key={i} className='bg-white p-6 rounded-lg shadow h-32'></div>
            ))}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div>
        <h1 className='text-2xl font-bold text-gray-900 mb-8'>Dashboard</h1>

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {/* Dealers Stats */}
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='text-2xl'>🏢</div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Total Dealers</dt>
                    <dd className='text-lg font-medium text-gray-900'>{stats?.dealers.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className='bg-gray-50 px-5 py-3'>
              <div className='text-sm'>
                <span className='text-green-600 font-medium'>+{stats?.dealers.newThisWeek}</span>
                <span className='text-gray-500'> this week</span>
              </div>
            </div>
          </div>

          {/* Sync Status */}
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='text-2xl'>🔄</div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Last Sync</dt>
                    <dd className='text-lg font-medium text-gray-900'>
                      {stats?.sync.lastSync
                        ? new Date(stats.sync.lastSync).toLocaleDateString()
                        : 'Never'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className='bg-gray-50 px-5 py-3'>
              <div className='text-sm'>
                <span
                  className={`font-medium ${stats?.sync.status === 'completed' ? 'text-green-600' : 'text-red-600'}`}
                >
                  {stats?.sync.status}
                </span>
                {stats?.sync.errors ? (
                  <span className='text-red-500'> • {stats.sync.errors} errors</span>
                ) : (
                  <span className='text-green-500'> • No errors</span>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Rules */}
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='text-2xl'>💰</div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Pricing Rules</dt>
                    <dd className='text-lg font-medium text-gray-900'>
                      {stats?.pricing.activeRules}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className='bg-gray-50 px-5 py-3'>
              <div className='text-sm'>
                <span className='text-orange-600 font-medium'>{stats?.pricing.expiringRules}</span>
                <span className='text-gray-500'> expiring soon</span>
              </div>
            </div>
          </div>

          {/* RFQ Requests */}
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='text-2xl'>📋</div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Pending RFQs</dt>
                    <dd className='text-lg font-medium text-gray-900'>{stats?.rfq.pending}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className='bg-gray-50 px-5 py-3'>
              <div className='text-sm'>
                <span className='text-blue-600 font-medium'>{stats?.rfq.thisWeek}</span>
                <span className='text-gray-500'> this week</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className='bg-white shadow rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>Recent Activity</h3>
            <div className='space-y-3'>
              <div className='flex items-center text-sm'>
                <span className='text-gray-400 mr-3'>🔄</span>
                <span className='text-gray-900'>Product sync completed successfully</span>
                <span className='ml-auto text-gray-500'>2 hours ago</span>
              </div>
              <div className='flex items-center text-sm'>
                <span className='text-gray-400 mr-3'>🏢</span>
                <span className='text-gray-900'>New dealer: Acme Industrial Solutions</span>
                <span className='ml-auto text-gray-500'>5 hours ago</span>
              </div>
              <div className='flex items-center text-sm'>
                <span className='text-gray-400 mr-3'>📋</span>
                <span className='text-gray-900'>RFQ #RFQ-1706643234 requires review</span>
                <span className='ml-auto text-gray-500'>1 day ago</span>
              </div>
              <div className='flex items-center text-sm'>
                <span className='text-gray-400 mr-3'>💰</span>
                <span className='text-gray-900'>Pricing rule updated for Dealer #15</span>
                <span className='ml-auto text-gray-500'>2 days ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='mt-8 bg-white shadow rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>Quick Actions</h3>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
              <button className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'>
                🔄 Trigger Sync
              </button>
              <button className='inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'>
                🏢 Add Dealer
              </button>
              <button className='inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'>
                💰 Bulk Pricing
              </button>
              <button className='inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'>
                📊 Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
