'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { name: 'Accounts', href: '/admin/accounts', icon: '👥' },
  { name: 'RFQ Management', href: '/admin/rfq', icon: '📋' },
  { name: 'Dealers (Legacy)', href: '/admin/dealers', icon: '🏢' },
  { name: 'Pricing', href: '/admin/pricing', icon: '💰' },
  { name: 'Sync Status', href: '/admin/sync', icon: '🔄' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className='h-screen flex overflow-hidden bg-gray-100'>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} fixed inset-0 flex z-40 md:hidden`}>
        <div
          className='fixed inset-0 bg-gray-600 bg-opacity-75'
          onClick={() => setSidebarOpen(false)}
        />
        <div className='relative flex-1 flex flex-col max-w-xs w-full bg-white'>
          <div className='absolute top-0 right-0 -mr-12 pt-2'>
            <button
              type='button'
              className='ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white'
              onClick={() => setSidebarOpen(false)}
            >
              <span className='sr-only'>Close sidebar</span>
              <span className='text-white text-xl'>×</span>
            </button>
          </div>
          <SidebarContent pathname={pathname} />
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className='hidden md:flex md:flex-shrink-0'>
        <div className='flex flex-col w-64'>
          <div className='flex flex-col h-0 flex-1 bg-white border-r border-gray-200'>
            <SidebarContent pathname={pathname} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className='flex flex-col w-0 flex-1 overflow-hidden'>
        {/* Top bar */}
        <div className='relative z-10 flex-shrink-0 flex h-16 bg-white shadow'>
          <button
            type='button'
            className='px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden'
            onClick={() => setSidebarOpen(true)}
          >
            <span className='sr-only'>Open sidebar</span>
            <span className='text-xl'>☰</span>
          </button>
          <div className='flex-1 px-4 flex justify-between'>
            <div className='flex-1 flex'>
              <h1 className='text-xl font-semibold text-gray-900 self-center'>Izerwaren Admin</h1>
            </div>
            <div className='ml-4 flex items-center md:ml-6'>
              <button
                type='button'
                className='bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
              >
                <span className='sr-only'>View notifications</span>
                <span className='text-lg'>🔔</span>
              </button>
              <div className='ml-3 relative'>
                <button
                  type='button'
                  className='bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                >
                  <span className='sr-only'>User menu</span>
                  <span className='text-lg'>👤</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className='flex-1 relative overflow-y-auto focus:outline-none'>
          <div className='py-6'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 md:px-8'>{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <>
      {/* Logo */}
      <div className='flex items-center h-16 flex-shrink-0 px-4 bg-primary-600'>
        <h2 className='text-white text-lg font-semibold'>Admin Portal</h2>
      </div>

      {/* Navigation */}
      <div className='flex-1 flex flex-col overflow-y-auto'>
        <nav className='flex-1 px-2 py-4 space-y-1'>
          {navigation.map(item => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isActive
                    ? 'bg-primary-100 border-primary-500 text-primary-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-3 py-2 text-sm font-medium border-l-4 transition-colors`}
              >
                <span className='mr-3 text-lg'>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className='flex-shrink-0 p-4 border-t border-gray-200'>
          <div className='text-xs text-gray-500'>
            <p>Izerwaren Revival 2.0</p>
            <p>Admin Interface v1.0</p>
          </div>
        </div>
      </div>
    </>
  );
}
