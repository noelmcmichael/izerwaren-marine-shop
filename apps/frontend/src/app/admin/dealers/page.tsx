'use client';

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/admin/AuthProvider';
import ProtectedRoute from '@/components/admin/ProtectedRoute';

interface Dealer {
  id: string;
  firebaseUid: string;
  companyName: string;
  contactEmail: string;
  contactPhone?: string;
  tier: 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
  isActive: boolean;
  createdAt: string;
  _count: {
    dealerPricing: number;
    rfqRequests: number;
  };
}

interface DealersResponse {
  dealers: Dealer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function DealersPage() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const { getIdToken } = useAuth();

  useEffect(() => {
    fetchDealers();
  }, [pagination.page]);

  const fetchDealers = async () => {
    try {
      const token = await getIdToken();
      if (!token) return;

      const response = await fetch(
        `/api/admin/dealers?page=${pagination.page}&limit=${pagination.limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data: DealersResponse = await response.json();
        setDealers(data.dealers);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch dealers');
      }
    } catch (error) {
      console.error('Error fetching dealers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDealers = dealers.filter(dealer => {
    const matchesSearch =
      dealer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dealer.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = !selectedTier || dealer.tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'ENTERPRISE':
        return 'bg-purple-100 text-purple-800';
      case 'PREMIUM':
        return 'bg-blue-100 text-blue-800';
      case 'STANDARD':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className='animate-pulse'>
          <div className='flex justify-between items-center mb-6'>
            <h1 className='text-2xl font-bold text-gray-900'>Dealers</h1>
            <div className='w-32 h-10 bg-gray-200 rounded'></div>
          </div>
          <div className='bg-white shadow rounded-lg p-6'>
            <div className='space-y-4'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='h-16 bg-gray-100 rounded'></div>
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
          <h1 className='text-2xl font-bold text-gray-900'>Dealers</h1>
          <Link
            href='/admin/dealers/create'
            className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
          >
            ➕ Add Dealer
          </Link>
        </div>

        {/* Filters */}
        <div className='bg-white p-4 rounded-lg shadow mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label htmlFor='search' className='block text-sm font-medium text-gray-700 mb-1'>
                Search
              </label>
              <input
                type='text'
                id='search'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder='Company name or email...'
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
              />
            </div>
            <div>
              <label htmlFor='tier' className='block text-sm font-medium text-gray-700 mb-1'>
                Tier
              </label>
              <select
                id='tier'
                value={selectedTier}
                onChange={e => setSelectedTier(e.target.value)}
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
              >
                <option value=''>All Tiers</option>
                <option value='STANDARD'>Standard</option>
                <option value='PREMIUM'>Premium</option>
                <option value='ENTERPRISE'>Enterprise</option>
              </select>
            </div>
            <div className='flex items-end'>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTier('');
                }}
                className='px-4 py-2 text-sm text-gray-600 hover:text-gray-900'
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Dealers Table */}
        <div className='bg-white shadow rounded-lg overflow-hidden'>
          <div className='px-4 py-5 sm:p-6'>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Company
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Contact
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Tier
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Pricing Rules
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      RFQs
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Status
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {filteredDealers.map(dealer => (
                    <tr key={dealer.id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div>
                          <div className='text-sm font-medium text-gray-900'>
                            {dealer.companyName}
                          </div>
                          <div className='text-sm text-gray-500'>ID: {dealer.id.slice(-8)}</div>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div>
                          <div className='text-sm text-gray-900'>{dealer.contactEmail}</div>
                          {dealer.contactPhone && (
                            <div className='text-sm text-gray-500'>{dealer.contactPhone}</div>
                          )}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTierBadgeColor(dealer.tier)}`}
                        >
                          {dealer.tier}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {dealer._count.dealerPricing}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {dealer._count.rfqRequests}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            dealer.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {dealer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2'>
                        <Link
                          href={`/admin/dealers/${dealer.id}`}
                          className='text-primary-600 hover:text-primary-900'
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/dealers/${dealer.id}/edit`}
                          className='text-gray-600 hover:text-gray-900'
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/admin/dealers/${dealer.id}/pricing`}
                          className='text-green-600 hover:text-green-900'
                        >
                          Pricing
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredDealers.length === 0 && (
                <div className='text-center py-8'>
                  <div className='text-gray-500'>
                    {searchTerm || selectedTier
                      ? 'No dealers match your filters'
                      : 'No dealers found'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className='px-4 py-3 border-t border-gray-200 sm:px-6'>
              <div className='flex items-center justify-between'>
                <div className='text-sm text-gray-700'>
                  Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
                </div>
                <div className='flex space-x-2'>
                  <button
                    onClick={() =>
                      setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                    }
                    disabled={pagination.page === 1}
                    className='px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPagination(prev => ({
                        ...prev,
                        page: Math.min(prev.pages, prev.page + 1),
                      }))
                    }
                    disabled={pagination.page === pagination.pages}
                    className='px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
