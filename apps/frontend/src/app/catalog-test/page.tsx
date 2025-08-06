export default function CatalogTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Catalog Test Page
        </h1>
        <p className="text-gray-600 mb-4">
          This is a simple test page to verify routing works.
        </p>
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Navigation Test</h2>
          <p>If you can see this page, the routing is working correctly.</p>
        </div>
      </div>
    </div>
  );
}