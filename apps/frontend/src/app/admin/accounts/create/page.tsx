'use client';

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

import { useAuth } from '@/components/admin/AuthProvider';
import ProtectedRoute from '@/components/admin/ProtectedRoute';

const CreateAccountSchema = z.object({
  firebaseUid: z.string().min(1, 'Firebase UID is required'),
  accountType: z.enum(['DEALER', 'PRO', 'ACCOUNT_REP']),
  companyName: z.string().optional(),
  contactEmail: z.string().email('Valid email is required'),
  contactPhone: z.string().optional(),
  tier: z.enum(['STANDARD', 'PREMIUM', 'ENTERPRISE']).optional(),
  territoryRegions: z.array(z.string()).optional(),
  maxRfqCapacity: z.number().optional(),
});

type CreateAccountForm = z.infer<typeof CreateAccountSchema> & {
  territoryRegionsText: string; // For UI input
};

export default function CreateAccountPage() {
  const [formData, setFormData] = useState<CreateAccountForm>({
    firebaseUid: '',
    accountType: 'DEALER',
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    tier: 'STANDARD',
    territoryRegions: [],
    territoryRegionsText: '',
    maxRfqCapacity: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { getIdToken } = useAuth();
  const router = useRouter();

  const handleInputChange = (
    field: keyof CreateAccountForm,
    value: string | number | undefined
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAccountTypeChange = (accountType: 'DEALER' | 'PRO' | 'ACCOUNT_REP') => {
    setFormData(prev => ({
      ...prev,
      accountType,
      // Reset fields that don't apply to all account types
      tier: accountType === 'ACCOUNT_REP' ? undefined : prev.tier || 'STANDARD',
      companyName: accountType === 'ACCOUNT_REP' ? '' : prev.companyName,
      territoryRegions: accountType === 'ACCOUNT_REP' ? prev.territoryRegions : [],
      territoryRegionsText: accountType === 'ACCOUNT_REP' ? prev.territoryRegionsText : '',
      maxRfqCapacity: accountType === 'ACCOUNT_REP' ? prev.maxRfqCapacity : undefined,
    }));
  };

  const validateForm = () => {
    try {
      // Convert territory regions text to array
      const territoryRegions = formData.territoryRegionsText
        ? formData.territoryRegionsText
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        : [];

      const validationData = {
        ...formData,
        territoryRegions,
        companyName: formData.companyName || undefined,
        tier: formData.tier || undefined,
        maxRfqCapacity: formData.maxRfqCapacity || undefined,
      };

      CreateAccountSchema.parse(validationData);
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

    // Additional validation for required company name
    if (
      (formData.accountType === 'DEALER' || formData.accountType === 'PRO') &&
      !formData.companyName
    ) {
      setErrors({ companyName: 'Company name is required for dealer and pro accounts' });
      return;
    }

    setSubmitting(true);

    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Convert territory regions text to array
      const territoryRegions = formData.territoryRegionsText
        ? formData.territoryRegionsText
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        : [];

      const submitData = {
        firebaseUid: formData.firebaseUid,
        accountType: formData.accountType,
        companyName: formData.companyName || undefined,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone || undefined,
        tier: formData.tier || undefined,
        territoryRegions,
        maxRfqCapacity: formData.maxRfqCapacity || undefined,
      };

      const response = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const account = await response.json();
        router.push(`/admin/accounts/${account.id}`);
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
          setErrors({ general: errorData.error || 'Failed to create account' });
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
                <Link href='/admin/accounts' className='text-gray-400 hover:text-gray-500'>
                  Accounts
                </Link>
              </li>
              <li>
                <div className='flex items-center'>
                  <span className='text-gray-400 mx-2'>/</span>
                  <span className='text-gray-500'>Create New Account</span>
                </div>
              </li>
            </ol>
          </nav>
          <h1 className='text-2xl font-bold text-gray-900 mt-2'>Create New Account</h1>
        </div>

        {/* Form */}
        <div className='bg-white shadow rounded-lg p-6'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {errors.general && (
              <div className='bg-red-50 border border-red-200 rounded-md p-4'>
                <div className='text-sm text-red-600'>{errors.general}</div>
              </div>
            )}

            {/* Account Type */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-3'>Account Type *</label>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {[
                  { type: 'DEALER' as const, label: 'Dealer', desc: 'Pro Account volume pricing' },
                  { type: 'PRO' as const, label: 'Pro Account', desc: 'Professional pricing' },
                  {
                    type: 'ACCOUNT_REP' as const,
                    label: 'Account Rep',
                    desc: 'Internal rep for RFQ management',
                  },
                ].map(option => (
                  <div
                    key={option.type}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      formData.accountType === option.type
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => handleAccountTypeChange(option.type)}
                  >
                    <div className='flex items-center'>
                      <input
                        type='radio'
                        checked={formData.accountType === option.type}
                        onChange={() => handleAccountTypeChange(option.type)}
                        className='h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300'
                      />
                      <div className='ml-3'>
                        <div className='text-sm font-medium text-gray-900'>{option.label}</div>
                        <div className='text-sm text-gray-500'>{option.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
            </div>

            {/* Company Name - Required for DEALER and PRO */}
            {(formData.accountType === 'DEALER' || formData.accountType === 'PRO') && (
              <div>
                <label
                  htmlFor='companyName'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
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
            )}

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

            {/* Tier - Only for DEALER and PRO */}
            {(formData.accountType === 'DEALER' || formData.accountType === 'PRO') && (
              <div>
                <label htmlFor='tier' className='block text-sm font-medium text-gray-700 mb-1'>
                  Account Tier
                </label>
                <select
                  id='tier'
                  value={formData.tier || ''}
                  onChange={e =>
                    handleInputChange(
                      'tier',
                      e.target.value as 'STANDARD' | 'PREMIUM' | 'ENTERPRISE'
                    )
                  }
                  className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                >
                  <option value='STANDARD'>Standard</option>
                  <option value='PREMIUM'>Premium</option>
                  <option value='ENTERPRISE'>Enterprise</option>
                </select>
              </div>
            )}

            {/* Account Rep specific fields */}
            {formData.accountType === 'ACCOUNT_REP' && (
              <>
                <div>
                  <label
                    htmlFor='territoryRegions'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Territory Regions
                  </label>
                  <input
                    type='text'
                    id='territoryRegions'
                    value={formData.territoryRegionsText}
                    onChange={e => handleInputChange('territoryRegionsText', e.target.value)}
                    className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                    placeholder='e.g., Northeast, Southeast, Midwest (comma separated)'
                  />
                  <p className='mt-1 text-sm text-gray-500'>Enter regions separated by commas</p>
                </div>

                <div>
                  <label
                    htmlFor='maxRfqCapacity'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Max RFQ Capacity
                  </label>
                  <input
                    type='number'
                    id='maxRfqCapacity'
                    value={formData.maxRfqCapacity || ''}
                    onChange={e =>
                      handleInputChange(
                        'maxRfqCapacity',
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                    placeholder='Maximum concurrent RFQ requests'
                    min='1'
                  />
                  <p className='mt-1 text-sm text-gray-500'>
                    Maximum number of RFQ requests this rep can handle simultaneously
                  </p>
                </div>
              </>
            )}

            {/* Submit Buttons */}
            <div className='flex justify-end space-x-3 pt-6'>
              <Link
                href='/admin/accounts'
                className='px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
              >
                Cancel
              </Link>
              <button
                type='submit'
                disabled={submitting}
                className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {submitting ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
