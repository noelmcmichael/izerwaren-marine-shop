'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface RfqItem {
  productTitle: string;
  sku: string;
  quantity: number;
  notes?: string;
}

export default function RequestQuotePage() {
  const [formData, setFormData] = useState({
    customerEmail: '',
    companyName: '',
    customerMessage: '',
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
  });
  const [items, setItems] = useState<RfqItem[]>([
    { productTitle: '', sku: '', quantity: 1, notes: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [rfqNumber, setRfqNumber] = useState('');
  const router = useRouter();

  const addItem = () => {
    setItems([...items, { productTitle: '', sku: '', quantity: 1, notes: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof RfqItem, value: string | number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.customerEmail || !formData.customerMessage) {
      alert('Please fill in required fields');
      return;
    }

    if (items.some(item => !item.productTitle || !item.sku || item.quantity < 1)) {
      alert('Please complete all item details');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/rfq/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          items,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setRfqNumber(result.requestNumber);
        setSubmitSuccess(true);
      } else {
        const error = await response.json();
        alert(`Error submitting request: ${error.error}`);
      }
    } catch (error) {
      console.error('Error submitting RFQ:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className='min-h-screen bg-gray-50 py-12'>
        <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-white rounded-lg shadow p-8 text-center'>
            <div className='text-green-600 text-6xl mb-4'>✓</div>
            <h1 className='text-2xl font-bold text-gray-900 mb-4'>
              Quote Request Submitted Successfully!
            </h1>
            <p className='text-gray-600 mb-6'>
              Your request has been submitted with reference number: <strong>{rfqNumber}</strong>
            </p>
            <p className='text-gray-600 mb-8'>
              Our team will review your request and get back to you with a detailed quote soon.
              You'll receive an email confirmation shortly.
            </p>
            <div className='space-x-4'>
              <button
                onClick={() => {
                  setSubmitSuccess(false);
                  setFormData({
                    customerEmail: '',
                    companyName: '',
                    customerMessage: '',
                    priority: 'NORMAL',
                  });
                  setItems([{ productTitle: '', sku: '', quantity: 1, notes: '' }]);
                }}
                className='px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700'
              >
                Submit Another Request
              </button>
              <button
                onClick={() => router.push('/')}
                className='px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50'
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='bg-white rounded-lg shadow'>
          {/* Header */}
          <div className='px-6 py-4 border-b border-gray-200'>
            <h1 className='text-2xl font-bold text-gray-900'>Request a Quote</h1>
            <p className='text-gray-600 mt-1'>
              Get custom pricing for your bulk orders. Fill out the form below and our team will get
              back to you.
            </p>
          </div>

          <form onSubmit={handleSubmit} className='p-6 space-y-6'>
            {/* Contact Information */}
            <div>
              <h2 className='text-lg font-medium text-gray-900 mb-4'>Contact Information</h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Email Address *
                  </label>
                  <input
                    type='email'
                    required
                    value={formData.customerEmail}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, customerEmail: e.target.value }))
                    }
                    className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                    placeholder='your@company.com'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Company Name
                  </label>
                  <input
                    type='text'
                    value={formData.companyName}
                    onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                    placeholder='Your Company Name'
                  />
                </div>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Priority</label>
              <select
                value={formData.priority}
                onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
              >
                <option value='LOW'>Low - No rush</option>
                <option value='NORMAL'>Normal - Standard timeline</option>
                <option value='HIGH'>High - Need quote soon</option>
                <option value='URGENT'>Urgent - Need quote ASAP</option>
              </select>
            </div>

            {/* Items */}
            <div>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-lg font-medium text-gray-900'>Items</h2>
                <button
                  type='button'
                  onClick={addItem}
                  className='px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700'
                >
                  + Add Item
                </button>
              </div>

              <div className='space-y-4'>
                {items.map((item, index) => (
                  <div key={index} className='border border-gray-200 rounded-lg p-4'>
                    <div className='flex justify-between items-start mb-3'>
                      <div className='text-sm font-medium text-gray-700'>Item {index + 1}</div>
                      {items.length > 1 && (
                        <button
                          type='button'
                          onClick={() => removeItem(index)}
                          className='text-red-600 hover:text-red-800 text-sm'
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Product Name *
                        </label>
                        <input
                          type='text'
                          required
                          value={item.productTitle}
                          onChange={e => updateItem(index, 'productTitle', e.target.value)}
                          className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                          placeholder='Product name'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          SKU/Model *
                        </label>
                        <input
                          type='text'
                          required
                          value={item.sku}
                          onChange={e => updateItem(index, 'sku', e.target.value)}
                          className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                          placeholder='SKU or model number'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Quantity *
                        </label>
                        <input
                          type='number'
                          min='1'
                          required
                          value={item.quantity}
                          onChange={e =>
                            updateItem(index, 'quantity', parseInt(e.target.value) || 1)
                          }
                          className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Notes
                        </label>
                        <input
                          type='text'
                          value={item.notes}
                          onChange={e => updateItem(index, 'notes', e.target.value)}
                          className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                          placeholder='Special requirements'
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Additional Message *
              </label>
              <textarea
                rows={4}
                required
                value={formData.customerMessage}
                onChange={e => setFormData(prev => ({ ...prev, customerMessage: e.target.value }))}
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                placeholder='Tell us about your project, timeline, or any special requirements...'
              />
            </div>

            {/* Submit */}
            <div className='flex justify-end space-x-3 pt-6 border-t border-gray-200'>
              <button
                type='button'
                onClick={() => router.push('/')}
                className='px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={submitting}
                className='px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {submitting ? 'Submitting...' : 'Submit Quote Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
