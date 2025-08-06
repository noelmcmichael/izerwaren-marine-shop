'use client';

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic';

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
    id: string;
    companyName?: string;
    contactEmail: string;
    accountType: string;
  };
  assignedRep?: {
    id: string;
    contactEmail: string;
    territoryRegions: string[];
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

interface AccountRep {
  id: string;
  contactEmail: string;
  territoryRegions: string[];
  maxRfqCapacity?: number;
  _count: {
    rfqRequestsAssigned: number;
  };
}

export default function RfqAdminPage() {
  const [rfqRequests, setRfqRequests] = useState<RfqRequest[]>([]);
  const [accountReps, setAccountReps] = useState<AccountRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRep, setSelectedRep] = useState('');
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [selectedRfqs, setSelectedRfqs] = useState<Set<string>>(new Set());
  const { getIdToken } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await getIdToken();
      if (!token) return;

      // Fetch RFQ requests
      const rfqResponse = await fetch('/api/admin/rfq', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (rfqResponse.ok) {
        const rfqData = await rfqResponse.json();
        setRfqRequests(rfqData.rfqRequests);
      }

      // Fetch Account Reps
      const repsResponse = await fetch('/api/admin/accounts?type=ACCOUNT_REP', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (repsResponse.ok) {
        const repsData = await repsResponse.json();
        setAccountReps(repsData.accounts);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedRep || selectedRfqs.size === 0) return;

    setBulkAssigning(true);
    try {
      const token = await getIdToken();
      if (!token) return;

      const response = await fetch('/api/admin/rfq/bulk-assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rfqIds: Array.from(selectedRfqs),
          assignedRepId: selectedRep,
        }),
      });

      if (response.ok) {
        await fetchData(); // Refresh data
        setSelectedRfqs(new Set());
        setSelectedRep('');
      }
    } catch (error) {
      console.error('Error in bulk assignment:', error);
    } finally {
      setBulkAssigning(false);
    }
  };

  const handleAutoAssign = async () => {
    try {
      const token = await getIdToken();
      if (!token) return;

      const response = await fetch('/api/admin/rfq/auto-assign', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error in auto assignment:', error);
    }
  };

  const filteredRfqs = rfqRequests.filter(rfq => {
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
          <h1 className='text-2xl font-bold text-gray-900 mb-6'>RFQ Management</h1>
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

  return (
    <ProtectedRoute>
      <div>
        {/* Header */}
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-2xl font-bold text-gray-900'>RFQ Management</h1>
          <div className='flex space-x-3'>
            <button
              onClick={handleAutoAssign}
              className='inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
            >
              🤖 Auto-Assign
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
          <div className='bg-yellow-50 p-4 rounded-lg'>
            <div className='text-2xl font-bold text-yellow-600'>
              {rfqRequests.filter(r => r.status === 'PENDING').length}
            </div>
            <div className='text-sm text-yellow-600'>Pending Assignment</div>
          </div>
          <div className='bg-blue-50 p-4 rounded-lg'>
            <div className='text-2xl font-bold text-blue-600'>
              {rfqRequests.filter(r => r.status === 'IN_REVIEW').length}
            </div>
            <div className='text-sm text-blue-600'>In Review</div>
          </div>
          <div className='bg-green-50 p-4 rounded-lg'>
            <div className='text-2xl font-bold text-green-600'>
              {rfqRequests.filter(r => r.status === 'QUOTED').length}
            </div>
            <div className='text-sm text-green-600'>Quoted</div>
          </div>
          <div className='bg-purple-50 p-4 rounded-lg'>
            <div className='text-2xl font-bold text-purple-600'>{accountReps.length}</div>
            <div className='text-sm text-purple-600'>Account Reps</div>
          </div>
        </div>

        {/* Bulk Assignment Bar */}
        {selectedRfqs.size > 0 && (
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
            <div className='flex items-center justify-between'>
              <div className='text-sm text-blue-700'>
                {selectedRfqs.size} RFQ{selectedRfqs.size !== 1 ? 's' : ''} selected
              </div>
              <div className='flex items-center space-x-3'>
                <select
                  value={selectedRep}
                  onChange={e => setSelectedRep(e.target.value)}
                  className='px-3 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>Select Account Rep...</option>
                  {accountReps.map(rep => (
                    <option key={rep.id} value={rep.id}>
                      {rep.contactEmail} ({rep._count.rfqRequestsAssigned} assigned)
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleBulkAssign}
                  disabled={!selectedRep || bulkAssigning}
                  className='px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {bulkAssigning ? 'Assigning...' : 'Assign'}
                </button>
                <button
                  onClick={() => setSelectedRfqs(new Set())}
                  className='px-3 py-1 text-blue-600 text-sm hover:text-blue-800'
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className='bg-white p-4 rounded-lg shadow mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div>
              <label htmlFor='status' className='block text-sm font-medium text-gray-700 mb-1'>
                Status
              </label>
              <select
                id='status'
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
              >
                <option value=''>All Statuses</option>
                <option value='PENDING'>Pending</option>
                <option value='IN_REVIEW'>In Review</option>
                <option value='QUOTED'>Quoted</option>
                <option value='ACCEPTED'>Accepted</option>
                <option value='DECLINED'>Declined</option>
                <option value='EXPIRED'>Expired</option>
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
                    <th className='px-6 py-3 text-left'>
                      <input
                        type='checkbox'
                        checked={
                          selectedRfqs.size === filteredRfqs.length && filteredRfqs.length > 0
                        }
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedRfqs(new Set(filteredRfqs.map(r => r.id)));
                          } else {
                            setSelectedRfqs(new Set());
                          }
                        }}
                        className='h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded'
                      />
                    </th>
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
                      Assigned Rep
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
                        <input
                          type='checkbox'
                          checked={selectedRfqs.has(rfq.id)}
                          onChange={e => {
                            const newSelected = new Set(selectedRfqs);
                            if (e.target.checked) {
                              newSelected.add(rfq.id);
                            } else {
                              newSelected.delete(rfq.id);
                            }
                            setSelectedRfqs(newSelected);
                          }}
                          className='h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded'
                        />
                      </td>
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
                      <td className='px-6 py-4 whitespace-nowrap'>
                        {rfq.assignedRep ? (
                          <div className='text-sm text-gray-900'>
                            {rfq.assignedRep.contactEmail}
                          </div>
                        ) : (
                          <span className='text-gray-400 italic'>Unassigned</span>
                        )}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {rfq.items.length} item{rfq.items.length !== 1 ? 's' : ''}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {rfq.quotedTotal ? formatCurrency(rfq.quotedTotal) : '-'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2'>
                        <Link
                          href={`/admin/rfq/${rfq.id}`}
                          className='text-primary-600 hover:text-primary-900'
                        >
                          View
                        </Link>
                        {!rfq.assignedRep && (
                          <Link
                            href={`/admin/rfq/${rfq.id}/assign`}
                            className='text-blue-600 hover:text-blue-900'
                          >
                            Assign
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
                    {selectedStatus ? 'No RFQs match your filters' : 'No RFQ requests found'}
                  </div>
                  {accountReps.length === 0 && (
                    <div className='mt-2'>
                      <Link
                        href='/admin/accounts/create'
                        className='text-primary-600 hover:text-primary-900'
                      >
                        Create your first Account Rep to get started
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
