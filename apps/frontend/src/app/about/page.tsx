import { Award, Anchor, Ship, Wrench } from 'lucide-react';
import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'About Us - Izerwaren',
  description:
    'Learn about Izerwaren Inc., your trusted marine hardware supplier since 1991. Serving the mega yacht industry with quality door, hatch, and cabinet hardware.',
};

export default function AboutPage() {
  return (
    <main className='min-h-screen bg-gray-50'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* Hero Section with Logo */}
        <div className='text-center mb-12'>
          <div className='flex justify-center mb-8'>
            <div className='bg-white rounded-xl shadow-lg p-8 inline-block'>
              <Image
                src='/images/izerwaren_logo_new.png'
                alt='Izerwaren Inc. Logo'
                width={300}
                height={120}
                className='mx-auto'
                priority
              />
            </div>
          </div>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>About Izerwaren Inc.</h1>
          <p className='text-xl text-gray-700 max-w-3xl mx-auto'>
            Your trusted marine hardware partner since 1991, serving the global mega yacht industry
            with premium solutions
          </p>
        </div>

        {/* Key Stats */}
        <div className='grid md:grid-cols-4 gap-6 mb-12'>
          <div className='bg-white rounded-lg shadow-lg p-6 text-center'>
            <div className='flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4 mx-auto'>
              <Award className='h-6 w-6 text-blue-600' />
            </div>
            <h3 className='text-2xl font-bold text-gray-900'>30+</h3>
            <p className='text-gray-600'>Years of Excellence</p>
          </div>

          <div className='bg-white rounded-lg shadow-lg p-6 text-center'>
            <div className='flex items-center justify-center w-12 h-12 bg-teal-100 rounded-lg mb-4 mx-auto'>
              <Ship className='h-6 w-6 text-teal-600' />
            </div>
            <h3 className='text-2xl font-bold text-gray-900'>900+</h3>
            <p className='text-gray-600'>Products in Stock</p>
          </div>

          <div className='bg-white rounded-lg shadow-lg p-6 text-center'>
            <div className='flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mb-4 mx-auto'>
              <Anchor className='h-6 w-6 text-indigo-600' />
            </div>
            <h3 className='text-2xl font-bold text-gray-900'>0</h3>
            <p className='text-gray-600'>Lead Time Shipping</p>
          </div>

          <div className='bg-white rounded-lg shadow-lg p-6 text-center'>
            <div className='flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4 mx-auto'>
              <Wrench className='h-6 w-6 text-green-600' />
            </div>
            <h3 className='text-2xl font-bold text-gray-900'>100%</h3>
            <p className='text-gray-600'>Technical Support</p>
          </div>
        </div>

        {/* Main Content */}
        <div className='bg-white rounded-lg shadow-lg p-8 md:p-12 mb-8'>
          <h2 className='text-3xl font-bold text-gray-900 mb-8 text-center'>Our Story</h2>

          <div className='prose prose-lg max-w-none'>
            <p className='text-xl text-gray-700 mb-8 leading-relaxed text-center'>
              Established in 1991 in Fort Lauderdale, Florida, Izerwaren Inc. has become the go-to
              U.S. supplier of premium hardware solutions for the global mega yacht industry.
            </p>

            <div className='grid md:grid-cols-2 gap-8 mb-8'>
              <div>
                <h3 className='text-2xl font-bold text-gray-900 mb-4'>Our Expertise</h3>
                <p className='text-lg text-gray-700 mb-4 leading-relaxed'>
                  We specialize in Door, Hatch, and Cabinet Hardware, offering the most refined and
                  reliable components for builders, shipyards, and refit specialists.
                </p>
                <p className='text-lg text-gray-700 leading-relaxed'>
                  Izerwaren pioneered the introduction of Stainless Steel Gas Springs to the mega
                  yacht market, delivering not just high-quality products but also the technical
                  expertise required for proper installation.
                </p>
              </div>

              <div>
                <h3 className='text-2xl font-bold text-gray-900 mb-4'>Our Commitment</h3>
                <p className='text-lg text-gray-700 mb-4 leading-relaxed'>
                  We maintain strong, long-standing relationships with both our suppliers and
                  customers, earning a reputation as a trusted partner for new builds, upgrades, and
                  retrofits.
                </p>
                <p className='text-lg text-gray-700 leading-relaxed'>
                  Our commitment extends beyond products to include comprehensive hardware
                  reconditioning and support for partial or full retrofit upgrades.
                </p>
              </div>
            </div>

            <div className='bg-gradient-to-r from-blue-50 to-teal-50 p-8 rounded-lg mb-8'>
              <h3 className='text-2xl font-bold text-gray-900 mb-6 text-center'>
                Our Product Portfolio
              </h3>
              <div className='grid md:grid-cols-3 gap-6'>
                <div className='text-center'>
                  <div className='bg-white rounded-lg p-4 shadow-sm mb-3'>
                    <h4 className='font-semibold text-gray-900'>Door Hardware</h4>
                  </div>
                  <p className='text-gray-700'>
                    Elite-grade hardware for exterior, interior, and glass door applications
                  </p>
                </div>
                <div className='text-center'>
                  <div className='bg-white rounded-lg p-4 shadow-sm mb-3'>
                    <h4 className='font-semibold text-gray-900'>Cabinet Hardware</h4>
                  </div>
                  <p className='text-gray-700'>
                    Elegant cabinet hardware lines selected for luxury vessels
                  </p>
                </div>
                <div className='text-center'>
                  <div className='bg-white rounded-lg p-4 shadow-sm mb-3'>
                    <h4 className='font-semibold text-gray-900'>Safety Equipment</h4>
                  </div>
                  <p className='text-gray-700'>
                    Advanced firefighting equipment from leading European shipyards
                  </p>
                </div>
              </div>
            </div>

            <div className='bg-blue-600 text-white p-8 rounded-lg text-center'>
              <h3 className='text-2xl font-bold mb-4'>Online Ordering – No Lead Times</h3>
              <p className='text-lg mb-4 opacity-90'>
                All in-stock products are available for immediate online purchase—over 900 SKUs
                ready to ship without delay.
              </p>
              <p className='text-lg'>
                For custom requirements or technical consultations, contact our team directly at{' '}
                <a href='tel:9547636686' className='font-bold underline hover:no-underline'>
                  954-763-6686
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
