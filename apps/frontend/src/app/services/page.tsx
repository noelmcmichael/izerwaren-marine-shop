import { ArrowRight, Wrench, Users, Cog } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Services - Izerwaren',
  description:
    'Professional marine hardware services including technical consultation, installation guidance, and refurbishment services for yachts and residential buildings.',
};

export default function ServicesPage() {
  return (
    <main className='min-h-screen bg-gray-50'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>Our Services</h1>
          <p className='text-xl text-gray-700 max-w-3xl mx-auto'>
            Professional marine hardware solutions with expert technical support and comprehensive
            refurbishment services
          </p>
        </div>

        {/* Services Grid */}
        <div className='grid md:grid-cols-3 gap-8 mb-12'>
          {/* Industry Service */}
          <div className='bg-white rounded-lg shadow-lg p-8'>
            <div className='flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-6 mx-auto'>
              <Cog className='h-8 w-8 text-blue-600' />
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-4 text-center'>
              Industry Solutions
            </h3>
            <p className='text-gray-700 text-center'>
              Serving the Marine, Office Building, and Residential Building industries with
              high-quality Door, Window, and Hatch Hardware.
            </p>
          </div>

          {/* Technical Support */}
          <div className='bg-white rounded-lg shadow-lg p-8'>
            <div className='flex items-center justify-center w-16 h-16 bg-green-100 rounded-lg mb-6 mx-auto'>
              <Users className='h-8 w-8 text-green-600' />
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-4 text-center'>
              Technical Support
            </h3>
            <p className='text-gray-700 text-center'>
              We provide technical information and advice on function and selection of the
              appropriate hardware for your specific needs.
            </p>
          </div>

          {/* Refurbishment */}
          <div className='bg-white rounded-lg shadow-lg p-8'>
            <div className='flex items-center justify-center w-16 h-16 bg-orange-100 rounded-lg mb-6 mx-auto'>
              <Wrench className='h-8 w-8 text-orange-600' />
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-4 text-center'>Refurbishment</h3>
            <p className='text-gray-700 text-center'>
              We can refurbish and upgrade the existing hardware of your yacht or residence with
              professional expertise.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className='bg-white rounded-lg shadow-lg p-8 md:p-12 mb-8'>
          <div className='prose prose-lg max-w-none'>
            <h2 className='text-3xl font-bold text-gray-900 mb-6'>
              Comprehensive Marine Hardware Services
            </h2>

            <p className='text-lg text-gray-700 mb-6 leading-relaxed'>
              Izerwaren Inc. serves the Marine, Office Building, and Residential Building industries
              with high-quality Door, Window, and Hatch Hardware.
            </p>

            <p className='text-lg text-gray-700 mb-6 leading-relaxed'>
              We also provide technical information and advice on function and model selection of
              the appropriate hardware for your specific requirements.
            </p>

            <p className='text-lg text-gray-700 mb-8 leading-relaxed'>
              Last but not least, we can refurbish and upgrade the existing hardware of your yacht
              or residence with professional expertise and quality craftsmanship.
            </p>

            <div className='bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg'>
              <p className='text-xl font-semibold text-blue-900 mb-2'>
                Talk to us for special needs or shop online!
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className='text-center'>
          <h3 className='text-2xl font-bold text-gray-900 mb-4'>Ready to Get Started?</h3>
          <p className='text-lg text-gray-700 mb-8'>
            Contact us today for expert consultation on your marine hardware needs
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link
              href='/contact'
              className='inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200'
            >
              Contact Us
              <ArrowRight className='ml-2 h-5 w-5' />
            </Link>
            <Link
              href='/request-quote'
              className='inline-flex items-center px-8 py-3 border border-blue-600 text-base font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition-all duration-200'
            >
              Request Quote
              <ArrowRight className='ml-2 h-5 w-5' />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
