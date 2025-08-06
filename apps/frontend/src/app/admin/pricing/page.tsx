'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/admin/AuthProvider';
import ProtectedRoute from '@/components/admin/ProtectedRoute';

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic';

interface DealerPricing {
  id: string;
  dealerId: string;
  shopifyProductId: string;
  shopifyVariantId?: string;
  markdownPercent: number;
  fixedPrice?: number;
  minQuantity: number;
  maxQuantity?: number;
  isActive: boolean;
  effectiveFrom: string;
  effectiveUntil?: string;
  dealer: {
    companyName: string;
    tier: string;
  };
}

interface PricingResponse {
  pricing: DealerPricing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function PricingPage() {
  const [pricingRules, setPricingRules] = useState<DealerPricing[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDealer, setSelectedDealer] = useState('');
  const [dealers, setDealers] = useState<{ id: string; companyName: string }[]>([]);
  const { getIdToken } = useAuth();

  useEffect(() => {
    fetchPricingRules();
    fetchDealers();
  }, [pagination.page]);

  const fetchPricingRules = async () => {
    try {
      const token = await getIdToken();
      if (!token) return;

      const response = await fetch(
        `/api/admin/pricing?page=${pagination.page}&limit=${pagination.limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data: PricingResponse = await response.json();
        setPricingRules(data.pricing);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch pricing rules');
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDealers = async () => {
    try {
      const token = await getIdToken();
      if (!token) return;

      const response = await fetch('/api/admin/dealers', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDealers(data.dealers);
      }
    } catch (error) {
      console.error('Error fetching dealers:', error);
    }
  };

  const filteredPricing = pricingRules.filter(rule => {
    const matchesSearch =
      rule.dealer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.shopifyProductId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDealer = !selectedDealer || rule.dealerId === selectedDealer;
    return matchesSearch && matchesDealer;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className='animate-pulse'>
          <div className='flex justify-between items-center mb-6'>
            <h1 className='text-2xl font-bold text-gray-900'>Pricing Rules</h1>
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
          <h1 className='text-2xl font-bold text-gray-900'>Pricing Rules</h1>
          <Link
            href='/admin/pricing/create'
            className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
          >
            ➕ Add Pricing Rule
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
                placeholder='Company name or product ID...'
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
              />
            </div>
            <div>
              <label htmlFor='dealer' className='block text-sm font-medium text-gray-700 mb-1'>
                Dealer
              </label>
              <select
                id='dealer'
                value={selectedDealer}
                onChange={e => setSelectedDealer(e.target.value)}
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
              >
                <option value=''>All Dealers</option>
                {dealers.map(dealer => (
                  <option key={dealer.id} value={dealer.id}>
                    {dealer.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div className='flex items-end'>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDealer('');
                }}
                className='px-4 py-2 text-sm text-gray-600 hover:text-gray-900'
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Rules Table */}
        <div className='bg-white shadow rounded-lg overflow-hidden'>
          <div className='px-4 py-5 sm:p-6'>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Dealer
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Product ID
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Discount
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Fixed Price
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Quantity
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Effective Period
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
                  {filteredPricing.map(rule => (
                    <tr key={rule.id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div>
                          <div className='text-sm font-medium text-gray-900'>
                            {rule.dealer.companyName}
                          </div>
                          <div className='text-sm text-gray-500'>{rule.dealer.tier}</div>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900'>{rule.shopifyProductId}</div>
                        {rule.shopifyVariantId && (
                          <div className='text-sm text-gray-500'>
                            Variant: {rule.shopifyVariantId}
                          </div>
                        )}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {rule.markdownPercent}%
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {rule.fixedPrice ? formatCurrency(rule.fixedPrice) : '-'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {rule.minQuantity}
                        {rule.maxQuantity ? ` - ${rule.maxQuantity}` : '+'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        <div>{formatDate(rule.effectiveFrom)}</div>
                        {rule.effectiveUntil && (
                          <div className='text-gray-500'>to {formatDate(rule.effectiveUntil)}</div>
                        )}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            rule.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2'>
                        <Link
                          href={`/admin/pricing/${rule.id}/edit`}
                          className='text-primary-600 hover:text-primary-900'
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => {
                            // TODO: Implement delete functionality
                            console.log('Delete pricing rule:', rule.id);
                          }}
                          className='text-red-600 hover:text-red-900'
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredPricing.length === 0 && (
                <div className='text-center py-8'>
                  <div className='text-gray-500'>
                    {searchTerm || selectedDealer
                      ? 'No pricing rules match your filters'
                      : 'No pricing rules found'}
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
