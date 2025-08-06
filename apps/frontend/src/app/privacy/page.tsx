import { Metadata } from 'next';
import { Shield, Eye, Lock, UserCheck, Database, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - Izerwaren',
  description: 'Izerwaren privacy policy. Learn how we collect, use, and protect your personal information when you visit our website or make purchases.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            {/* Last Updated */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-blue-800 text-sm">
                <strong>Last Updated:</strong> December 28, 2024
              </p>
            </div>

            {/* Introduction */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Shield className="h-6 w-6 mr-2 text-blue-600" />
                Our Commitment to Your Privacy
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                At Izerwaren Inc., we are committed to protecting your privacy and ensuring the security of your personal 
                information. This Privacy Policy explains how we collect, use, and safeguard your information when you 
                visit our website or make purchases from us.
              </p>
            </div>

            {/* Information We Collect */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Database className="h-6 w-6 mr-2 text-green-600" />
                Information We Collect
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Personal Information</h3>
              <p className="text-gray-700 mb-4">When you make a purchase or contact us, we may collect:</p>
              <ul className="text-gray-700 space-y-2 mb-6">
                <li>• Name and contact information (email, phone, address)</li>
                <li>• Billing and shipping addresses</li>
                <li>• Payment information (processed securely through our payment processors)</li>
                <li>• Order history and preferences</li>
                <li>• Communication history with our customer service team</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Automatically Collected Information</h3>
              <ul className="text-gray-700 space-y-2 mb-6">
                <li>• Website usage data and analytics</li>
                <li>• IP address and browser information</li>
                <li>• Pages visited and time spent on our site</li>
                <li>• Referral sources and search terms</li>
              </ul>
            </div>

            {/* How We Use Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <UserCheck className="h-6 w-6 mr-2 text-purple-600" />
                How We Use Your Information
              </h2>
              <p className="text-gray-700 mb-4">We use your information to:</p>
              <ul className="text-gray-700 space-y-2 mb-6">
                <li>• Process and fulfill your orders</li>
                <li>• Provide customer service and technical support</li>
                <li>• Send order confirmations and shipping updates</li>
                <li>• Improve our website and services</li>
                <li>• Communicate about new products and special offers (with your consent)</li>
                <li>• Comply with legal obligations and prevent fraud</li>
              </ul>
            </div>

            {/* Information Sharing */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Globe className="h-6 w-6 mr-2 text-orange-600" />
                Information Sharing
              </h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in these limited circumstances:
              </p>
              <ul className="text-gray-700 space-y-2 mb-6">
                <li>• <strong>Service Providers:</strong> Trusted partners who help us operate our business (payment processors, shipping companies, etc.)</li>
                <li>• <strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                <li>• <strong>Business Transfers:</strong> In the event of a merger or sale of our business</li>
                <li>• <strong>With Your Consent:</strong> When you explicitly agree to share information</li>
              </ul>
            </div>

            {/* Data Security */}
            <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg mb-8">
              <h2 className="text-2xl font-bold text-green-900 mb-4 flex items-center">
                <Lock className="h-6 w-6 mr-2" />
                Data Security
              </h2>
              <p className="text-green-800 mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="text-green-800 space-y-2">
                <li>• SSL encryption for all data transmission</li>
                <li>• Secure servers and databases</li>
                <li>• Regular security audits and updates</li>
                <li>• Restricted access to personal information</li>
                <li>• PCI DSS compliance for payment processing</li>
              </ul>
            </div>

            {/* Cookies and Tracking */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Eye className="h-6 w-6 mr-2 text-indigo-600" />
                Cookies and Tracking
              </h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar technologies to enhance your browsing experience:
              </p>
              <ul className="text-gray-700 space-y-2 mb-6">
                <li>• <strong>Essential Cookies:</strong> Required for website functionality</li>
                <li>• <strong>Analytics Cookies:</strong> Help us understand how visitors use our site</li>
                <li>• <strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li>• <strong>Marketing Cookies:</strong> Used to show relevant advertisements (with consent)</li>
              </ul>
              <p className="text-gray-700">
                You can control cookie settings through your browser preferences. Note that disabling certain cookies may affect website functionality.
              </p>
            </div>

            {/* Your Rights */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights and Choices</h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="text-gray-700 space-y-2 mb-6">
                <li>• Access and review your personal information</li>
                <li>• Request corrections to inaccurate information</li>
                <li>• Request deletion of your personal information (subject to legal requirements)</li>
                <li>• Opt-out of marketing communications</li>
                <li>• Request a copy of your data in a portable format</li>
              </ul>
            </div>

            {/* Third-Party Links */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Links</h2>
              <p className="text-gray-700">
                Our website may contain links to third-party websites. We are not responsible for the privacy practices 
                of these external sites. We encourage you to review their privacy policies before providing any personal information.
              </p>
            </div>

            {/* Children's Privacy */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
              <p className="text-gray-700">
                Our website is not intended for children under 13 years of age. We do not knowingly collect personal 
                information from children under 13. If we become aware that we have collected such information, we will 
                delete it promptly.
              </p>
            </div>

            {/* Changes to Policy */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by 
                posting the new policy on our website and updating the &ldquo;Last Updated&rdquo; date. Your continued use of our 
                services after any changes constitutes acceptance of the updated policy.
              </p>
            </div>

            {/* Contact Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-blue-900 mb-4">Contact Us About Privacy</h2>
              <p className="text-blue-800 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="text-blue-800 space-y-2">
                <p><strong>Izerwaren Inc.</strong></p>
                <p>📍 2207 South Andrews Avenue, Fort Lauderdale, FL 33316</p>
                <p>📞 Phone: <a href="tel:9547636686" className="font-semibold hover:text-blue-900">(954) 763-6686</a></p>
                <p>📧 Email: <a href="mailto:sales@izerwaren.com" className="font-semibold hover:text-blue-900">sales@izerwaren.com</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}