import { Metadata } from 'next';
import { AlertCircle, Package, Mail, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Return Policy - Izerwaren',
  description: 'Izerwaren return policy and procedures. Learn about our 30-day return window, eligible items, and exchange process.',
};

export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Return Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            {/* Eligibility Section */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-8">
              <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center">
                <Package className="h-6 w-6 mr-2" />
                Eligibility for Refunds and Exchanges
              </h2>
              <ul className="text-blue-800 space-y-2">
                <li>• Your item must be unused and in the same condition that you received it</li>
                <li>• The item must be in the original packaging</li>
                <li>• To complete your return, we require a receipt or proof of purchase</li>
                <li>• Only regular priced items may be refunded, sale items cannot be refunded</li>
              </ul>
            </div>

            {/* Exchanges Section */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Mail className="h-6 w-6 mr-2" />
              Exchanges (if applicable)
            </h2>
            <p className="text-lg text-gray-700 mb-4">
              We only replace items if they are defective or damaged. If you need to exchange it for the same item, 
              send us an email at{' '}
              <a href="mailto:sales@izerwaren.com" className="text-blue-600 hover:text-blue-800 font-semibold">
                sales@izerwaren.com
              </a>{' '}
              and send your item to:
            </p>
            
            <div className="bg-gray-100 p-6 rounded-lg mb-8">
              <p className="font-semibold text-gray-900 mb-2">Return Address:</p>
              <p className="text-gray-800">
                Izerwaren Inc<br />
                2207 S. Andrews Avenue<br />
                Fort Lauderdale, FL 33065
              </p>
            </div>

            {/* Exempt Goods Section */}
            <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-lg mb-8">
              <h2 className="text-2xl font-bold text-orange-900 mb-4 flex items-center">
                <AlertCircle className="h-6 w-6 mr-2" />
                Exempt Goods
              </h2>
              <p className="text-orange-800 mb-4">The following are exempt from refunds:</p>
              <ul className="text-orange-800 space-y-2">
                <li>• Custom Modified Parts</li>
                <li>• Custom Plated Parts</li>
              </ul>
            </div>

            {/* Partial Refunds Section */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Partial Refunds (if applicable)</h2>
            <p className="text-lg text-gray-700 mb-4">Partial refunds are granted for:</p>
            <ul className="text-gray-700 space-y-2 mb-8">
              <li>• Any item not in its original condition, is damaged or missing parts for reasons not due to our error</li>
              <li>• Any item that is returned more than 30 days after delivery</li>
            </ul>

            {/* Refund Process Section */}
            <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg mb-8">
              <h2 className="text-2xl font-bold text-green-900 mb-4 flex items-center">
                <Clock className="h-6 w-6 mr-2" />
                Refund Process
              </h2>
              <p className="text-green-800 mb-4">
                Once your return is received and inspected, we will send you an email to notify you that we have 
                received your returned item. We will also notify you of the approval or rejection of your refund.
              </p>
              <p className="text-green-800 mb-4">
                If you are approved, then your refund will be processed, and a credit will automatically be applied 
                to your credit card or original method of payment, within a certain amount of days.
              </p>
            </div>

            {/* Late or Missing Refunds */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Late or Missing Refunds</h2>
            <p className="text-lg text-gray-700 mb-4">
              If you have not received a refund yet, first check your bank account again. Then contact your credit 
              card company, it may take some time before your refund is officially posted.
            </p>
            <p className="text-lg text-gray-700 mb-8">
              If you have done all of this and you still have not received your refund yet, please contact us at{' '}
              <a href="mailto:sales@izerwaren.com" className="text-blue-600 hover:text-blue-800 font-semibold">
                sales@izerwaren.com
              </a>
            </p>

            {/* Shipping Section */}
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg mb-8">
              <h2 className="text-2xl font-bold text-red-900 mb-4">Shipping</h2>
              <div className="text-red-800 space-y-4">
                <p>
                  <strong>Please do not send the product back to the manufacturer.</strong> It must be sent to the following address:
                </p>
                <div className="bg-white p-4 rounded border border-red-200">
                  <p className="font-semibold text-red-900 mb-2">Return Address:</p>
                  <p className="text-red-800">
                    Izerwaren Inc<br />
                    2207 S. Andrews Avenue<br />
                    Fort Lauderdale, FL 33065
                  </p>
                </div>
                <p>You will be responsible for paying for your own shipping costs for returning your item.</p>
                <p><strong>Shipping costs are non-refundable!</strong> If you receive a refund, the cost of return shipping will be deducted from your refund.</p>
                <p>
                  Depending on where you live, the time it may take for your exchanged product to reach you may vary.
                </p>
                <p>
                  <strong>Please note:</strong> We cannot guarantee that we will receive your returned item.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Questions About Returns?</h3>
              <p className="text-blue-800 mb-4">
                If you have any questions about our return policy, please don&rsquo;t hesitate to contact us:
              </p>
              <div className="text-blue-800">
                <p>📧 Email: <a href="mailto:sales@izerwaren.com" className="font-semibold hover:text-blue-900">sales@izerwaren.com</a></p>
                <p>📞 Phone: <a href="tel:9547636686" className="font-semibold hover:text-blue-900">(954) 763-6686</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}