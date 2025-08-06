import { Metadata } from 'next';
import { Truck, Globe, Package, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shipping Information - Izerwaren',
  description: 'Izerwaren shipping options and policies. We ship worldwide using UPS, DHL, FedEx, USPS, and work with freight forwarders and chandlers.',
};

export default function ShippingPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Shipping Information</h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Worldwide shipping solutions for marine hardware with multiple carrier options and specialized services
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 mb-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <Globe className="h-8 w-8 mr-3 text-blue-600" />
              Global Shipping Solutions
            </h2>
            
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              <strong>Izerwaren Inc.</strong> ships the products that it sells worldwide. We use internationally 
              established shippers and work closely with our clients to provide the best shipping solutions for 
              their specific needs.
            </p>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Shipping Carriers */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                  <Truck className="h-6 w-6 mr-2" />
                  Shipping Carriers
                </h3>
                <ul className="text-blue-800 space-y-2">
                  <li>• <strong>UPS</strong> - Reliable domestic and international delivery</li>
                  <li>• <strong>DHL</strong> - Express international shipping</li>
                  <li>• <strong>FedEx</strong> - Fast and secure shipping solutions</li>
                  <li>• <strong>US Postal Service</strong> - Cost-effective shipping options</li>
                </ul>
              </div>

              {/* Specialized Services */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center">
                  <Users className="h-6 w-6 mr-2" />
                  Specialized Services
                </h3>
                <ul className="text-green-800 space-y-2">
                  <li>• <strong>Freight Forwarders</strong> - For large or complex shipments</li>
                  <li>• <strong>Chandlers</strong> - Direct yacht and ship delivery</li>
                  <li>• <strong>Trucking Companies</strong> - Overland freight solutions</li>
                  <li>• <strong>Custom Solutions</strong> - Tailored to your needs</li>
                </ul>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-lg mb-8">
              <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center">
                <Package className="h-6 w-6 mr-2" />
                Important Shipping Notice
              </h3>
              <p className="text-orange-800 text-lg">
                <strong>The shipping cost is always extra and not included in the sales price</strong> of the parts 
                offered for sale. Shipping costs will be calculated and quoted separately based on your location, 
                package size, weight, and preferred delivery method.
              </p>
            </div>

            {/* Why Choose Our Shipping */}
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Why Choose Our Shipping Services?</h3>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Worldwide Reach</h4>
                <p className="text-gray-700 text-sm">We ship to ports and destinations around the globe</p>
              </div>

              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Multiple Options</h4>
                <p className="text-gray-700 text-sm">Choose from various carriers and delivery speeds</p>
              </div>

              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Expert Support</h4>
                <p className="text-gray-700 text-sm">Our team helps you choose the best shipping solution</p>
              </div>
            </div>

            {/* Marine Industry Specialization */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-8">
              <h3 className="text-2xl font-bold text-blue-900 mb-4">Marine Industry Specialization</h3>
              <p className="text-blue-800 text-lg mb-4">
                With over 30 years of experience in the marine industry, we understand the unique shipping 
                requirements for yacht and ship hardware:
              </p>
              <ul className="text-blue-800 space-y-2">
                <li>• <strong>Port Delivery:</strong> Direct delivery to marinas and shipyards worldwide</li>
                <li>• <strong>Chandler Services:</strong> Coordination with marine supply companies</li>
                <li>• <strong>Time-Critical Delivery:</strong> Emergency parts delivery for vessels in port</li>
                <li>• <strong>Custom Documentation:</strong> Proper paperwork for international maritime shipping</li>
                <li>• <strong>Packaging Expertise:</strong> Secure packaging for marine environment transport</li>
              </ul>
            </div>

            {/* Contact for Shipping */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-green-900 mb-4">Need a Shipping Quote?</h3>
              <p className="text-green-800 mb-4">
                Contact us for personalized shipping quotes and to discuss the best delivery options for your order:
              </p>
              <div className="text-green-800 space-y-2">
                <p>📞 Phone: <a href="tel:9547636686" className="font-semibold hover:text-green-900">(954) 763-6686</a></p>
                <p>📧 Email: <a href="mailto:sales@izerwaren.com" className="font-semibold hover:text-green-900">sales@izerwaren.com</a></p>
                <p>🕒 Hours: Monday-Thursday 8:30am-4:30pm EST, Friday 8:30am-4:00pm EST</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Facts */}
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">30+</div>
            <div className="text-gray-700">Years Experience</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">4</div>
            <div className="text-gray-700">Major Carriers</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">Global</div>
            <div className="text-gray-700">Shipping Coverage</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
            <div className="text-gray-700">Tracking Support</div>
          </div>
        </div>
      </div>
    </main>
  );
}