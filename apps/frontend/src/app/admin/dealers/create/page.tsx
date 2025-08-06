'use client';

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

import { useAuth } from '@/components/admin/AuthProvider';
import ProtectedRoute from '@/components/admin/ProtectedRoute';

const CreateDealerSchema = z.object({
  firebaseUid: z.string().min(1, 'Firebase UID is required'),
  companyName: z.string().min(1, 'Company name is required'),
  contactEmail: z.string().email('Valid email is required'),
  contactPhone: z.string().optional(),
  tier: z.enum(['STANDARD', 'PREMIUM', 'ENTERPRISE']),
});

type CreateDealerForm = z.infer<typeof CreateDealerSchema>;

export default function CreateDealerPage() {
  const [formData, setFormData] = useState<CreateDealerForm>({
    firebaseUid: '',
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    tier: 'STANDARD',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { getIdToken } = useAuth();
  const router = useRouter();

  const handleInputChange = (field: keyof CreateDealerForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    try {
      CreateDealerSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/admin/dealers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const dealer = await response.json();
        router.push(`/admin/dealers/${dealer.id}`);
      } else {
        const errorData = await response.json();
        if (errorData.details) {
          // Handle validation errors from server
          const newErrors: Record<string, string> = {};
          errorData.details.forEach((err: any) => {
            if (err.path && err.path.length > 0) {
              newErrors[err.path[0]] = err.message;
            }
          });
          setErrors(newErrors);
        } else {
          setErrors({ general: errorData.error || 'Failed to create dealer' });
        }
      }
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className='max-w-2xl mx-auto'>
        {/* Header */}
        <div className='mb-6'>
          <nav className='flex' aria-label='Breadcrumb'>
            <ol className='flex items-center space-x-4'>
              <li>
                <Link href='/admin/dealers' className='text-gray-400 hover:text-gray-500'>
                  Dealers
                </Link>
              </li>
              <li>
                <div className='flex items-center'>
                  <span className='text-gray-400 mx-2'>/</span>
                  <span className='text-gray-500'>Create New Dealer</span>
                </div>
              </li>
            </ol>
          </nav>
          <h1 className='text-2xl font-bold text-gray-900 mt-2'>Create New Dealer</h1>
        </div>

        {/* Form */}
        <div className='bg-white shadow rounded-lg p-6'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {errors.general && (
              <div className='bg-red-50 border border-red-200 rounded-md p-4'>
                <div className='text-sm text-red-600'>{errors.general}</div>
              </div>
            )}

            {/* Firebase UID */}
            <div>
              <label htmlFor='firebaseUid' className='block text-sm font-medium text-gray-700 mb-1'>
                Firebase UID *
              </label>
              <input
                type='text'
                id='firebaseUid'
                value={formData.firebaseUid}
                onChange={e => handleInputChange('firebaseUid', e.target.value)}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                  errors.firebaseUid ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='Enter Firebase UID from user account'
              />
              {errors.firebaseUid && (
                <p className='mt-1 text-sm text-red-600'>{errors.firebaseUid}</p>
              )}
              <p className='mt-1 text-sm text-gray-500'>
                The Firebase UID from the user's authentication account
              </p>
            </div>

            {/* Company Name */}
            <div>
              <label htmlFor='companyName' className='block text-sm font-medium text-gray-700 mb-1'>
                Company Name *
              </label>
              <input
                type='text'
                id='companyName'
                value={formData.companyName}
                onChange={e => handleInputChange('companyName', e.target.value)}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                  errors.companyName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='Enter company name'
              />
              {errors.companyName && (
                <p className='mt-1 text-sm text-red-600'>{errors.companyName}</p>
              )}
            </div>

            {/* Contact Email */}
            <div>
              <label
                htmlFor='contactEmail'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Contact Email *
              </label>
              <input
                type='email'
                id='contactEmail'
                value={formData.contactEmail}
                onChange={e => handleInputChange('contactEmail', e.target.value)}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                  errors.contactEmail ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='Enter contact email'
              />
              {errors.contactEmail && (
                <p className='mt-1 text-sm text-red-600'>{errors.contactEmail}</p>
              )}
            </div>

            {/* Contact Phone */}
            <div>
              <label
                htmlFor='contactPhone'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Contact Phone
              </label>
              <input
                type='tel'
                id='contactPhone'
                value={formData.contactPhone}
                onChange={e => handleInputChange('contactPhone', e.target.value)}
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                placeholder='Enter contact phone (optional)'
              />
            </div>

            {/* Dealer Tier */}
            <div>
              <label htmlFor='tier' className='block text-sm font-medium text-gray-700 mb-1'>
                Dealer Tier *
              </label>
              <select
                id='tier'
                value={formData.tier}
                onChange={e =>
                  handleInputChange('tier', e.target.value as 'STANDARD' | 'PREMIUM' | 'ENTERPRISE')
                }
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
              >
                <option value='STANDARD'>Standard</option>
                <option value='PREMIUM'>Premium</option>
                <option value='ENTERPRISE'>Enterprise</option>
              </select>
              <div className='mt-1 text-sm text-gray-500'>
                <div>
                  <strong>Standard:</strong> Basic pricing and support
                </div>
                <div>
                  <strong>Premium:</strong> Enhanced pricing and priority support
                </div>
                <div>
                  <strong>Enterprise:</strong> Custom pricing and dedicated support
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className='flex justify-end space-x-3 pt-6'>
              <Link
                href='/admin/dealers'
                className='px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
              >
                Cancel
              </Link>
              <button
                type='submit'
                disabled={submitting}
                className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {submitting ? 'Creating...' : 'Create Dealer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
