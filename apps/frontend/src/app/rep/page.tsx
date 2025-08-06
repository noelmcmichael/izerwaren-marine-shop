'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/admin/AuthProvider';
import ProtectedRoute from '@/components/admin/ProtectedRoute';

interface RfqRequest {
  id: string;
  requestNumber: string;
  status: 'PENDING' | 'IN_REVIEW' | 'QUOTED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  customerMessage: string;
  quotedTotal?: number;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    companyName?: string;
    contactEmail: string;
    accountType: string;
  };
  items: Array<{
    id: string;
    productTitle: string;
    quantity: number;
    sku: string;
    unitPrice?: number;
    totalPrice?: number;
  }>;
}

interface RepProfile {
  id: string;
  contactEmail: string;
  territoryRegions: string[];
  maxRfqCapacity?: number;
  isActive: boolean;
  _count: {
    rfqRequestsAssigned: number;
  };
}

export default function RepDashboardPage() {
  const [assignedRfqs, setAssignedRfqs] = useState<RfqRequest[]>([]);
  const [repProfile, setRepProfile] = useState<RepProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const { getIdToken } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await getIdToken();
      if (!token) return;

      // Fetch rep profile and assigned RFQs
      const response = await fetch('/api/rep/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setRepProfile(data.profile);
        setAssignedRfqs(data.assignedRfqs);
      } else if (response.status === 403) {
        // Not an account rep - redirect or show error
        console.error('Access denied: Not an Account Rep');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRfqStatus = async (rfqId: string, newStatus: string) => {
    try {
      const token = await getIdToken();
      if (!token) return;

      const response = await fetch(`/api/rep/rfq/${rfqId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating RFQ status:', error);
    }
  };

  const filteredRfqs = assignedRfqs.filter(rfq => {
    const matchesStatus = !selectedStatus || rfq.status === selectedStatus;
    return matchesStatus;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_REVIEW':
        return 'bg-blue-100 text-blue-800';
      case 'QUOTED':
        return 'bg-green-100 text-green-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'DECLINED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800';
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className='animate-pulse'>
          <h1 className='text-2xl font-bold text-gray-900 mb-6'>Account Rep Dashboard</h1>
          <div className='bg-white shadow rounded-lg p-6'>
            <div className='space-y-4'>
              {[...Array(3)].map((_, i) => (
                <div key={i} className='h-20 bg-gray-100 rounded'></div>
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!repProfile) {
    return (
      <ProtectedRoute>
        <div className='min-h-screen flex items-center justify-center'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>Access Denied</h2>
            <p className='text-gray-600 mb-4'>You must be an Account Rep to access this portal.</p>
            <Link href='/admin/dashboard' className='text-primary-600 hover:text-primary-900'>
              Return to Admin Dashboard
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className='min-h-screen bg-gray-100'>
        {/* Header */}
        <div className='bg-white shadow'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex justify-between items-center py-6'>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>Account Rep Portal</h1>
                <p className='text-gray-600'>Welcome, {repProfile.contactEmail}</p>
              </div>
              <div className='flex space-x-4'>
                <Link href='/admin/dashboard' className='text-gray-600 hover:text-gray-900'>
                  Admin Portal
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {/* Profile Summary */}
          <div className='bg-white rounded-lg shadow p-6 mb-8'>
            <h2 className='text-lg font-medium text-gray-900 mb-4'>Your Profile</h2>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <div className='text-sm text-gray-500'>Territory Regions</div>
                <div className='font-medium'>
                  {repProfile.territoryRegions.length > 0
                    ? repProfile.territoryRegions.join(', ')
                    : 'All Regions'}
                </div>
              </div>
              <div>
                <div className='text-sm text-gray-500'>Current Workload</div>
                <div className='font-medium'>
                  {repProfile._count.rfqRequestsAssigned}
                  {repProfile.maxRfqCapacity && ` / ${repProfile.maxRfqCapacity}`} RFQs
                </div>
              </div>
              <div>
                <div className='text-sm text-gray-500'>Status</div>
                <div className='font-medium'>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      repProfile.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {repProfile.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
            <div className='bg-blue-50 p-4 rounded-lg'>
              <div className='text-2xl font-bold text-blue-600'>
                {assignedRfqs.filter(r => r.status === 'IN_REVIEW').length}
              </div>
              <div className='text-sm text-blue-600'>In Review</div>
            </div>
            <div className='bg-green-50 p-4 rounded-lg'>
              <div className='text-2xl font-bold text-green-600'>
                {assignedRfqs.filter(r => r.status === 'QUOTED').length}
              </div>
              <div className='text-sm text-green-600'>Quoted</div>
            </div>
            <div className='bg-orange-50 p-4 rounded-lg'>
              <div className='text-2xl font-bold text-orange-600'>
                {assignedRfqs.filter(r => r.priority === 'HIGH' || r.priority === 'URGENT').length}
              </div>
              <div className='text-sm text-orange-600'>High Priority</div>
            </div>
            <div className='bg-purple-50 p-4 rounded-lg'>
              <div className='text-2xl font-bold text-purple-600'>{assignedRfqs.length}</div>
              <div className='text-sm text-purple-600'>Total Assigned</div>
            </div>
          </div>

          {/* Filters */}
          <div className='bg-white p-4 rounded-lg shadow mb-6'>
            <div className='flex items-center space-x-4'>
              <div>
                <label htmlFor='status' className='block text-sm font-medium text-gray-700 mb-1'>
                  Status
                </label>
                <select
                  id='status'
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className='px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                >
                  <option value=''>All Statuses</option>
                  <option value='IN_REVIEW'>In Review</option>
                  <option value='QUOTED'>Quoted</option>
                  <option value='ACCEPTED'>Accepted</option>
                  <option value='DECLINED'>Declined</option>
                </select>
              </div>
              <div className='flex items-end'>
                <button
                  onClick={() => setSelectedStatus('')}
                  className='px-4 py-2 text-sm text-gray-600 hover:text-gray-900'
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* RFQ Table */}
          <div className='bg-white shadow rounded-lg overflow-hidden'>
            <div className='px-4 py-5 sm:p-6'>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Request
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Customer
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Status
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Items
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Quote Value
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {filteredRfqs.map(rfq => (
                      <tr key={rfq.id} className='hover:bg-gray-50'>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div>
                            <div className='text-sm font-medium text-gray-900'>
                              {rfq.requestNumber}
                            </div>
                            <div className='text-sm text-gray-500'>
                              {new Date(rfq.createdAt).toLocaleDateString()}
                            </div>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadgeColor(rfq.priority)}`}
                            >
                              {rfq.priority}
                            </span>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div>
                            <div className='text-sm font-medium text-gray-900'>
                              {rfq.customer.companyName || rfq.customer.contactEmail}
                            </div>
                            <div className='text-sm text-gray-500'>{rfq.customer.accountType}</div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(rfq.status)}`}
                          >
                            {rfq.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {rfq.items.length} item{rfq.items.length !== 1 ? 's' : ''}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {rfq.quotedTotal ? formatCurrency(rfq.quotedTotal) : '-'}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2'>
                          <Link
                            href={`/rep/rfq/${rfq.id}`}
                            className='text-primary-600 hover:text-primary-900'
                          >
                            View Details
                          </Link>
                          {rfq.status === 'IN_REVIEW' && (
                            <Link
                              href={`/rep/rfq/${rfq.id}/quote`}
                              className='text-green-600 hover:text-green-900'
                            >
                              Create Quote
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredRfqs.length === 0 && (
                  <div className='text-center py-8'>
                    <div className='text-gray-500'>
                      {selectedStatus
                        ? 'No RFQs match your filters'
                        : 'No RFQ requests assigned to you'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
