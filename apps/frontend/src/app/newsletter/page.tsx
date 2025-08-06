import { Metadata } from 'next';
import { Mail, Bell, Star, Anchor, Shield, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Newsletter Signup - Izerwaren',
  description: 'Subscribe to the Izerwaren newsletter for updates on new marine hardware products, exclusive sales, industry news, and technical tips.',
};

export default function NewsletterPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Stay Connected with Izerwaren</h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Subscribe to our newsletter for exclusive updates on new products, special sales events, and valuable marine hardware insights
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          {/* Newsletter Signup Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Join Our Newsletter</h2>
            
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Your first name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Your last name"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company/Organization
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Your company name (optional)"
                />
              </div>

              <div>
                <label htmlFor="interests" className="block text-sm font-medium text-gray-700 mb-2">
                  Areas of Interest
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" name="interests" value="marine-locks" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-gray-700">Marine Locks & Security Hardware</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" name="interests" value="gas-springs" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-gray-700">Gas Springs & Actuators</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" name="interests" value="fasteners" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-gray-700">Fasteners & Hardware</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" name="interests" value="fire-fighting" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-gray-700">Fire Fighting Equipment</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" name="interests" value="new-products" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-gray-700">New Product Announcements</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" name="interests" value="sales" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-gray-700">Sales & Special Offers</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-start">
                  <input 
                    type="checkbox" 
                    name="privacy" 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1" 
                    required 
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I agree to receive email communications from Izerwaren Inc. and understand I can unsubscribe at any time. 
                    View our <a href="/privacy" className="text-blue-600 hover:text-blue-800">Privacy Policy</a>.
                  </span>
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Subscribe to Newsletter
                </button>
              </div>
            </form>
          </div>

          {/* Benefits */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <Bell className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Early Access to Sales</h3>
              </div>
              <p className="text-gray-700">
                Be the first to know about exclusive discounts, clearance events, and special promotional offers on marine hardware.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <Star className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">New Product Launches</h3>
              </div>
              <p className="text-gray-700">
                Stay updated on the latest marine hardware innovations, new product lines, and exclusive product releases.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <Anchor className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Industry Insights</h3>
              </div>
              <p className="text-gray-700">
                Get expert tips, technical guides, and industry news relevant to marine hardware and yacht maintenance.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Event Notifications</h3>
              </div>
              <p className="text-gray-700">
                Receive invitations to trade shows, product demonstrations, and special events in the marine industry.
              </p>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">What Our Subscribers Say</h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Anchor className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-gray-700 mb-4 italic">
                &ldquo;The newsletter keeps me informed about new products perfect for our yacht refurbishment projects. Great technical content!&rdquo;
              </p>
              <p className="font-semibold text-gray-900">Captain James Mitchell</p>
              <p className="text-sm text-gray-600">Luxury Yacht Services</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-gray-700 mb-4 italic">
                &ldquo;Izerwaren&rsquo;s early sale notifications have saved us thousands on our marine hardware purchases. Highly recommended!&rdquo;
              </p>
              <p className="font-semibold text-gray-900">Maria Rodriguez</p>
              <p className="text-sm text-gray-600">Marina Operations Manager</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-gray-700 mb-4 italic">
                &ldquo;Professional newsletter with valuable industry insights. The product updates help us stay competitive in our business.&rdquo;
              </p>
              <p className="font-semibold text-gray-900">David Chen</p>
              <p className="text-sm text-gray-600">Marine Equipment Distributor</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h3 className="text-xl font-bold text-blue-900 mb-4">Questions About Our Newsletter?</h3>
          <p className="text-blue-800 mb-4">
            Contact us if you have any questions about our newsletter or subscription process.
          </p>
          <div className="text-blue-800">
            <p>📧 Email: <a href="mailto:sales@izerwaren.com" className="font-semibold hover:text-blue-900">sales@izerwaren.com</a></p>
            <p>📞 Phone: <a href="tel:9547636686" className="font-semibold hover:text-blue-900">(954) 763-6686</a></p>
          </div>
        </div>
      </div>
    </main>
  );
}