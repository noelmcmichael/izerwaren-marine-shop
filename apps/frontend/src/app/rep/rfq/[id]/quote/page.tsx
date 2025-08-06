'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/admin/AuthProvider';
import ProtectedRoute from '@/components/admin/ProtectedRoute';

interface RfqItem {
  id: string;
  productTitle: string;
  quantity: number;
  sku: string;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
}

interface RfqRequest {
  id: string;
  requestNumber: string;
  status: string;
  priority: string;
  customerMessage: string;
  quotedTotal?: number;
  validUntil?: string;
  customer: {
    companyName?: string;
    contactEmail: string;
    accountType: string;
  };
  items: RfqItem[];
}

interface QuoteItem {
  id: string;
  unitPrice: number;
  notes?: string;
}

export default function QuoteBuilderPage() {
  const [rfqRequest, setRfqRequest] = useState<RfqRequest | null>(null);
  const [quoteItems, setQuoteItems] = useState<Record<string, QuoteItem>>({});
  const [quoteValid, setQuoteValid] = useState(30); // days
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { getIdToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const rfqId = params.id as string;

  useEffect(() => {
    fetchRfqDetails();
  }, [rfqId]);

  const fetchRfqDetails = async () => {
    try {
      const token = await getIdToken();
      if (!token) return;

      const response = await fetch(`/api/rep/rfq/${rfqId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const rfq = await response.json();
        setRfqRequest(rfq);

        // Initialize quote items with existing prices if available
        const initialQuoteItems: Record<string, QuoteItem> = {};
        rfq.items.forEach((item: RfqItem) => {
          initialQuoteItems[item.id] = {
            id: item.id,
            unitPrice: item.unitPrice || 0,
            notes: item.notes || '',
          };
        });
        setQuoteItems(initialQuoteItems);
        setAdminNotes(rfq.adminNotes || '');
      } else if (response.status === 403) {
        console.error('Access denied');
      }
    } catch (error) {
      console.error('Error fetching RFQ details:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateItemPrice = (itemId: string, unitPrice: number) => {
    setQuoteItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        unitPrice,
      },
    }));
  };

  const updateItemNotes = (itemId: string, notes: string) => {
    setQuoteItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        notes,
      },
    }));
  };

  const calculateTotal = () => {
    if (!rfqRequest) return 0;

    return rfqRequest.items.reduce((total, item) => {
      const quoteItem = quoteItems[item.id];
      if (quoteItem && quoteItem.unitPrice > 0) {
        return total + quoteItem.unitPrice * item.quantity;
      }
      return total;
    }, 0);
  };

  const handleSubmitQuote = async () => {
    if (!rfqRequest) return;

    const total = calculateTotal();
    if (total <= 0) {
      alert('Please set prices for all items before submitting the quote');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getIdToken();
      if (!token) return;

      const quoteData = {
        items: rfqRequest.items.map(item => ({
          id: item.id,
          unitPrice: quoteItems[item.id]?.unitPrice || 0,
          totalPrice: (quoteItems[item.id]?.unitPrice || 0) * item.quantity,
          notes: quoteItems[item.id]?.notes || '',
        })),
        quotedTotal: total,
        validUntil: new Date(Date.now() + quoteValid * 24 * 60 * 60 * 1000), // days from now
        adminNotes,
      };

      const response = await fetch(`/api/rep/rfq/${rfqId}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quoteData),
      });

      if (response.ok) {
        router.push('/rep');
      } else {
        const error = await response.json();
        alert(`Error submitting quote: ${error.error}`);
      }
    } catch (error) {
      console.error('Error submitting quote:', error);
      alert('Failed to submit quote');
    } finally {
      setSubmitting(false);
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
        <div className='animate-pulse min-h-screen bg-gray-100'>
          <div className='max-w-4xl mx-auto px-4 py-8'>
            <div className='h-8 bg-gray-300 rounded mb-6'></div>
            <div className='bg-white p-6 rounded-lg shadow'>
              <div className='space-y-4'>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className='h-16 bg-gray-100 rounded'></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!rfqRequest) {
    return (
      <ProtectedRoute>
        <div className='min-h-screen flex items-center justify-center'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>RFQ Not Found</h2>
            <Link href='/rep' className='text-primary-600 hover:text-primary-900'>
              Return to Dashboard
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
          <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex justify-between items-center py-6'>
              <div>
                <nav className='flex' aria-label='Breadcrumb'>
                  <ol className='flex items-center space-x-4'>
                    <li>
                      <Link href='/rep' className='text-gray-400 hover:text-gray-500'>
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <span className='text-gray-400 mx-2'>/</span>
                      <span className='text-gray-500'>Quote Builder</span>
                    </li>
                  </ol>
                </nav>
                <h1 className='text-2xl font-bold text-gray-900 mt-2'>
                  Create Quote - {rfqRequest.requestNumber}
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {/* Customer Info */}
          <div className='bg-white rounded-lg shadow p-6 mb-6'>
            <h2 className='text-lg font-medium text-gray-900 mb-4'>Customer Information</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <div className='text-sm text-gray-500'>Company</div>
                <div className='font-medium'>
                  {rfqRequest.customer.companyName || rfqRequest.customer.contactEmail}
                </div>
              </div>
              <div>
                <div className='text-sm text-gray-500'>Account Type</div>
                <div className='font-medium'>{rfqRequest.customer.accountType}</div>
              </div>
            </div>
            <div className='mt-4'>
              <div className='text-sm text-gray-500'>Customer Message</div>
              <div className='mt-1 p-3 bg-gray-50 rounded border text-sm'>
                {rfqRequest.customerMessage}
              </div>
            </div>
          </div>

          {/* Quote Items */}
          <div className='bg-white rounded-lg shadow p-6 mb-6'>
            <h2 className='text-lg font-medium text-gray-900 mb-4'>Quote Items</h2>
            <div className='space-y-4'>
              {rfqRequest.items.map(item => (
                <div key={item.id} className='border rounded-lg p-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <div className='font-medium text-gray-900'>{item.productTitle}</div>
                      <div className='text-sm text-gray-500'>SKU: {item.sku}</div>
                      <div className='text-sm text-gray-500'>Quantity: {item.quantity}</div>
                    </div>
                    <div className='space-y-3'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Unit Price *
                        </label>
                        <div className='relative'>
                          <span className='absolute left-3 top-2 text-gray-500'>$</span>
                          <input
                            type='number'
                            step='0.01'
                            min='0'
                            value={quoteItems[item.id]?.unitPrice || ''}
                            onChange={e =>
                              updateItemPrice(item.id, parseFloat(e.target.value) || 0)
                            }
                            className='pl-7 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                            placeholder='0.00'
                          />
                        </div>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Line Total
                        </label>
                        <div className='text-lg font-medium text-green-600'>
                          {formatCurrency((quoteItems[item.id]?.unitPrice || 0) * item.quantity)}
                        </div>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Notes (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={quoteItems[item.id]?.notes || ''}
                          onChange={e => updateItemNotes(item.id, e.target.value)}
                          className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                          placeholder='Special pricing notes...'
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quote Summary */}
          <div className='bg-white rounded-lg shadow p-6 mb-6'>
            <h2 className='text-lg font-medium text-gray-900 mb-4'>Quote Summary</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Quote Valid For (days)
                  </label>
                  <input
                    type='number'
                    min='1'
                    max='365'
                    value={quoteValid}
                    onChange={e => setQuoteValid(parseInt(e.target.value) || 30)}
                    className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                  />
                </div>
                <div className='mt-4'>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Internal Notes
                  </label>
                  <textarea
                    rows={3}
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                    placeholder='Internal notes about this quote...'
                  />
                </div>
              </div>
              <div className='flex flex-col justify-end'>
                <div className='text-right'>
                  <div className='text-sm text-gray-500'>Total Quote Value</div>
                  <div className='text-3xl font-bold text-green-600'>
                    {formatCurrency(calculateTotal())}
                  </div>
                  <div className='text-sm text-gray-500 mt-1'>
                    Valid until:{' '}
                    {new Date(Date.now() + quoteValid * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className='flex justify-end space-x-3'>
            <Link
              href='/rep'
              className='px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmitQuote}
              disabled={submitting || calculateTotal() <= 0}
              className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {submitting ? 'Submitting Quote...' : 'Submit Quote'}
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
