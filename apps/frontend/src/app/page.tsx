import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import FeaturedCategories from '@/components/home/FeaturedCategories';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import HeroSection from '@/components/home/HeroSection';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <main className='min-h-screen'>
      {/* Hero Section */}
      <HeroSection />

      {/* Featured Categories */}
      <FeaturedCategories />

      {/* Featured Products Section */}
      <FeaturedProducts />

      {/* Platform Overview */}
      <section className='py-16 bg-white'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid md:grid-cols-2 gap-8 mb-12'>
            <div className='bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-xl border border-blue-200'>
              <h2 className='text-2xl font-semibold mb-4 text-blue-900'>🏪 E-commerce Platform</h2>
              <p className='text-blue-800 mb-6'>
                Professional e-commerce platform powered by Shopify with custom Pro Account
                capabilities.
              </p>
              <ul className='text-blue-700 space-y-2 mb-6'>
                <li>✅ 947+ Products with full specifications</li>
                <li>✅ Secure checkout & payment processing</li>
                <li>✅ Global CDN for optimized images</li>
                <li>✅ Real-time inventory management</li>
              </ul>
              <Link
                href='/catalog'
                className='inline-flex items-center text-blue-600 font-medium hover:text-blue-700 transition-colors duration-200'
              >
                Browse Products
                <ArrowRight className='ml-2 h-4 w-4' />
              </Link>
            </div>

            <div className='bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-xl border border-green-200'>
              <h2 className='text-2xl font-semibold mb-4 text-green-900'>
                🏭 Pro Account Solutions
              </h2>
              <p className='text-green-800 mb-6'>
                Specialized Pro Account portal with bulk ordering, custom pricing, and dealer
                management.
              </p>
              <ul className='text-green-700 space-y-2 mb-6'>
                <li>✅ Bulk ordering with volume discounts</li>
                <li>✅ Custom dealer pricing tiers</li>
                <li>✅ Quote management system</li>
                <li>✅ Account management portal</li>
              </ul>
              <Link
                href='/dashboard'
                className='inline-flex items-center text-green-600 font-medium hover:text-green-700 transition-colors duration-200'
              >
                Pro Account Portal
                <ArrowRight className='ml-2 h-4 w-4' />
              </Link>
            </div>
          </div>

          {/* Call to Action Section */}
          <div className='bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-center text-white'>
            <h3 className='text-2xl font-bold mb-4'>Ready to Find the Perfect Marine Hardware?</h3>
            <p className='text-lg mb-6 opacity-90'>
              Browse our complete catalog or contact our experts for personalized recommendations
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link
                href='/catalog-live'
                className='inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200 border-2 border-white'
              >
                🔴 View LIVE Catalog
                <ArrowRight className='ml-2 h-5 w-5' />
              </Link>
              <Link
                href='/catalog'
                className='inline-flex items-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors duration-200'
              >
                View Standard Catalog
                <ArrowRight className='ml-2 h-5 w-5' />
              </Link>
              <Link
                href='/contact'
                className='inline-flex items-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors duration-200'
              >
                Contact Experts
                <ArrowRight className='ml-2 h-5 w-5' />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup Section */}
      <section className='py-16 bg-blue-50'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <h2 className='text-3xl font-bold text-gray-900 mb-4'>Stay Updated</h2>
          <p className='text-lg text-gray-700 mb-8'>
            Subscribe to our newsletter for exclusive sales, new product announcements, and marine
            industry insights
          </p>
          <Link
            href='/newsletter'
            className='inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200'
          >
            Subscribe to Newsletter
            <ArrowRight className='ml-2 h-5 w-5' />
          </Link>
        </div>
      </section>
    </main>
  );
}
