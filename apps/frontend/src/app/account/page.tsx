'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { User, Package, Settings } from 'lucide-react';
import Link from 'next/link';

export default function AccountPage() {
  // Placeholder user data - replace with real authentication later
  const user = {
    name: 'Marine Professional',
    email: 'professional@marine.com',
    memberSince: '2024',
    orderCount: 0,
  };

  const accountMenuItems = [
    {
      title: 'Profile Information',
      description: 'Manage your account details',
      icon: User,
      href: '/account/profile',
      available: false,
    },
    {
      title: 'Order History',
      description: 'View your past orders',
      icon: Package,
      href: '/account/orders',
      available: false,
    },
    {
      title: 'Account Settings',
      description: 'Update preferences and settings',
      icon: Settings,
      href: '/account/settings',
      available: false,
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white shadow'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='py-6'>
            <div className='md:flex md:items-center md:justify-between'>
              <div className='flex-1 min-w-0'>
                <h1 className='text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate'>
                  My Account
                </h1>
                <div className='mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6'>
                  <div className='mt-2 flex items-center text-sm text-gray-500'>
                    <User className='flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400' />
                    {user.name}
                  </div>
                  <div className='mt-2 flex items-center text-sm text-gray-500'>
                    Member since {user.memberSince}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {/* Account Overview */}
          <div className='lg:col-span-1'>
            <div className='bg-white overflow-hidden shadow rounded-lg'>
              <div className='px-4 py-5 sm:p-6'>
                <h3 className='text-lg leading-6 font-medium text-gray-900'>Account Overview</h3>
                <div className='mt-5'>
                  <dl className='grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-1'>
                    <div>
                      <dt className='text-sm font-medium text-gray-500'>Email</dt>
                      <dd className='mt-1 text-sm text-gray-900'>{user.email}</dd>
                    </div>
                    <div>
                      <dt className='text-sm font-medium text-gray-500'>Total Orders</dt>
                      <dd className='mt-1 text-sm text-gray-900'>{user.orderCount}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className='mt-6 bg-white overflow-hidden shadow rounded-lg'>
              <div className='px-4 py-5 sm:p-6'>
                <h3 className='text-lg leading-6 font-medium text-gray-900'>Quick Actions</h3>
                <div className='mt-5 space-y-3'>
                  <Link
                    href='/catalog'
                    className='inline-flex items-center px-4 py-2 border border-marine-300 shadow-sm text-sm font-medium rounded-md text-marine-700 bg-white hover:bg-marine-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-500'
                  >
                    Browse Products
                  </Link>
                  <Link
                    href='/request-quote'
                    className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-marine-600 hover:bg-marine-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-500 ml-3'
                  >
                    Request Quote
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Account Menu */}
          <div className='lg:col-span-2'>
            <div className='bg-white shadow rounded-lg'>
              <div className='px-4 py-5 sm:p-6'>
                <h3 className='text-lg leading-6 font-medium text-gray-900 mb-6'>
                  Account Management
                </h3>
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                  {accountMenuItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className={`relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm ${
                          item.available
                            ? 'hover:border-gray-400 cursor-pointer'
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        {item.available ? (
                          <Link href={item.href} className='block'>
                            <div className='flex items-center'>
                              <Icon className='h-6 w-6 text-marine-600' />
                              <div className='ml-3'>
                                <h4 className='text-sm font-medium text-gray-900'>{item.title}</h4>
                                <p className='text-sm text-gray-500'>{item.description}</p>
                              </div>
                            </div>
                          </Link>
                        ) : (
                          <div className='flex items-center'>
                            <Icon className='h-6 w-6 text-gray-400' />
                            <div className='ml-3'>
                              <h4 className='text-sm font-medium text-gray-400'>{item.title}</h4>
                              <p className='text-sm text-gray-400'>Coming soon</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className='mt-6 bg-blue-50 border border-blue-200 rounded-lg'>
              <div className='px-4 py-5 sm:p-6'>
                <div className='flex'>
                  <div className='flex-shrink-0'>
                    <User className='h-6 w-6 text-blue-600' />
                  </div>
                  <div className='ml-3'>
                    <h3 className='text-sm font-medium text-blue-800'>Guest Account</h3>
                    <div className='mt-2 text-sm text-blue-700'>
                      <p>
                        You&apos;re browsing as a guest. Create an account to save your preferences,
                        track orders, and access exclusive features.
                      </p>
                    </div>
                    <div className='mt-4'>
                      <Link
                        href='/login'
                        className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      >
                        Sign In / Register
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
