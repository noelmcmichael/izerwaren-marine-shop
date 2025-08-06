'use client';

import { Search, Menu, X, User, ChevronDown, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

import { MiniCart } from '../cart/MiniCart';

interface MainHeaderProps {
  className?: string;
}

export const MainHeader: React.FC<MainHeaderProps> = ({ className = '' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();

  const navigation = [
    { name: 'Home', href: '/', current: pathname === '/' },
    {
      name: 'Products',
      href: '/catalog',
      current: pathname?.startsWith('/catalog') || pathname?.startsWith('/product'),
      hasDropdown: true,
      dropdownItems: [
        { name: 'Browse All Products', href: '/catalog', description: 'View our complete catalog' },
        {
          name: 'Marine Locks',
          href: '/catalog?category=MARINE%20LOCKS',
          description: 'Cam locks, barrel locks, and more',
        },
        {
          name: 'Fasteners',
          href: '/catalog?category=FASTENERS',
          description: 'Bolts, screws, and hardware',
        },
        {
          name: 'Hardware',
          href: '/catalog?category=HARDWARE',
          description: 'General marine hardware',
        },
        { name: 'View All Categories', href: '/categories', description: 'Browse by category' },
      ],
    },
    {
      name: 'Services',
      href: '/services',
      current: pathname?.startsWith('/services'),
    },
    { name: 'About', href: '/about', current: pathname === '/about' },
    { name: 'Contact', href: '/contact', current: pathname === '/contact' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`bg-gradient-to-r from-white to-marine-50 shadow-marine border-b border-marine-200 sticky top-0 z-50 ${className}`}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-20'>
          {/* Logo */}
          <div className='flex-shrink-0'>
            <Link href='/' className='flex items-center'>
              <div className='flex flex-col items-center'>
                <Image
                  src='/images/izerwaren_logo_new.png'
                  alt='Izerwaren Logo'
                  width={64}
                  height={64}
                  className='h-14 w-14 object-contain'
                  priority
                />
                <div className='text-xs font-semibold text-gray-700 text-center mt-1 tracking-wide'>
                  IZERWAREN INC.
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className='hidden md:flex space-x-8'>
            {navigation.map(item => (
              <div key={item.name} className='relative group'>
                {item.hasDropdown ? (
                  <div>
                    <button
                      className={`${
                        item.current
                          ? 'border-marine-500 text-marine-600'
                          : 'border-transparent text-navy-600 hover:border-marine-300 hover:text-marine-700'
                      } inline-flex items-center px-1 pt-2 border-b-2 text-sm font-medium transition-colors duration-200 h-20`}
                      onMouseEnter={() =>
                        item.name === 'Products' && setIsProductsDropdownOpen(true)
                      }
                      onMouseLeave={() =>
                        item.name === 'Products' && setIsProductsDropdownOpen(false)
                      }
                    >
                      {item.name}
                      <ChevronDown className='ml-1 h-4 w-4' />
                    </button>

                    {/* Dropdown Menu */}
                    {item.name === 'Products' && (
                      <div
                        className={`absolute left-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 transition-all duration-200 ${
                          isProductsDropdownOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                        }`}
                        onMouseEnter={() => setIsProductsDropdownOpen(true)}
                        onMouseLeave={() => setIsProductsDropdownOpen(false)}
                      >
                        <div className='py-1'>
                          {item.dropdownItems?.map(dropdownItem => (
                            <Link
                              key={dropdownItem.name}
                              href={dropdownItem.href}
                              className='block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150'
                            >
                              <div className='font-medium'>{dropdownItem.name}</div>
                              <div className='text-xs text-gray-500 mt-1'>
                                {dropdownItem.description}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`${
                      item.current
                        ? 'border-marine-500 text-marine-600'
                        : 'border-transparent text-navy-600 hover:border-marine-300 hover:text-marine-700'
                    } inline-flex items-center px-1 pt-2 border-b-2 text-sm font-medium transition-colors duration-200 h-20`}
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Search Bar */}
          <div className='hidden md:flex flex-1 max-w-lg mx-8'>
            <form onSubmit={handleSearch} className='w-full'>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Search className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  type='text'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='block w-full pl-10 pr-3 py-2 border border-marine-300 rounded-md leading-5 bg-white placeholder-navy-400 focus:outline-none focus:placeholder-navy-300 focus:ring-1 focus:ring-marine-500 focus:border-marine-500 text-sm'
                  placeholder='Search products...'
                />
              </div>
            </form>
          </div>

          {/* Right side icons */}
          <div className='hidden md:flex items-center space-x-4'>
            <Link
              href='/account'
              className='text-gray-400 hover:text-gray-500 transition-colors duration-200'
            >
              <User className='h-6 w-6' />
            </Link>
            <MiniCart />
          </div>

          {/* Mobile menu button */}
          <div className='md:hidden'>
            <button
              type='button'
              className='bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500'
              onClick={toggleMobileMenu}
            >
              <span className='sr-only'>Open main menu</span>
              {isMobileMenuOpen ? (
                <X className='block h-6 w-6' />
              ) : (
                <Menu className='block h-6 w-6' />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className='md:hidden'>
          <div className='px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200'>
            {/* Mobile Search */}
            <div className='px-3 py-2'>
              <form onSubmit={handleSearch}>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <Search className='h-5 w-5 text-gray-400' />
                  </div>
                  <input
                    type='text'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className='block w-full pl-10 pr-3 py-2 border border-marine-300 rounded-md leading-5 bg-white placeholder-navy-400 focus:outline-none focus:placeholder-navy-300 focus:ring-1 focus:ring-marine-500 focus:border-marine-500 text-sm'
                    placeholder='Search products...'
                  />
                </div>
              </form>
            </div>

            {/* Mobile Navigation Links */}
            {navigation.map(item => (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className={`${
                    item.current
                      ? 'bg-marine-50 border-marine-500 text-marine-700'
                      : 'border-transparent text-navy-600 hover:bg-marine-50 hover:border-marine-300 hover:text-marine-800'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
                  onClick={closeMobileMenu}
                >
                  {item.name}
                </Link>
                {/* Mobile dropdown items */}
                {item.hasDropdown && item.dropdownItems && (
                  <div className='pl-6 space-y-1'>
                    {item.dropdownItems.map(dropdownItem => (
                      <Link
                        key={dropdownItem.name}
                        href={dropdownItem.href}
                        className='block py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-150'
                        onClick={closeMobileMenu}
                      >
                        {dropdownItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Mobile account and cart */}
            <div className='pt-4 pb-3 border-t border-gray-200'>
              <div className='flex items-center px-5 space-x-3'>
                <Link
                  href='/account'
                  className='flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200'
                  onClick={closeMobileMenu}
                >
                  <User className='h-5 w-5 mr-2' />
                  Account
                </Link>
                <div className='flex items-center text-gray-600'>
                  <ShoppingCart className='h-5 w-5 mr-2' />
                  <span className='mr-4'>Cart</span>
                  <MiniCart />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default MainHeader;
