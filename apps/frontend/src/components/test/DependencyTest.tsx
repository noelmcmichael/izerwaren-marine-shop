/**
 * Dependency Test Component for Task 1.7
 * Tests React, TailwindCSS, and SWR integration
 */

'use client';

import useSWR from 'swr';
import { useState } from 'react';

// Simple fetcher for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DependencyTest() {
  const [count, setCount] = useState(0);
  
  // Test SWR with a mock API endpoint
  const { data, error, isLoading } = useSWR('/api/health', fetcher);

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-xl shadow-lg space-y-4">
      {/* Test TailwindCSS styling */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🧪 Dependency Test Component
        </h1>
        <p className="text-gray-600 mb-6">
          Testing React 18, TailwindCSS, and SWR integration
        </p>
      </div>

      {/* Test React 18 state management */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">
          ✅ React 18 State Test
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-blue-700">Count: {count}</span>
          <button
            onClick={() => setCount(c => c + 1)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Increment
          </button>
        </div>
      </div>

      {/* Test SWR data fetching */}
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h2 className="text-lg font-semibold text-green-900 mb-2">
          ✅ SWR Data Fetching Test
        </h2>
        <div className="text-green-700">
          {isLoading && (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
              Loading health status...
            </div>
          )}
          {error && (
            <div className="text-red-600">
              ❌ Error: {error.message || 'Failed to fetch'}
            </div>
          )}
          {data && (
            <div>
              ✅ API Response: {data.status || 'Success'}
              {data.timestamp && (
                <div className="text-sm text-green-600 mt-1">
                  Last check: {new Date(data.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Test TailwindCSS responsive design */}
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <h2 className="text-lg font-semibold text-purple-900 mb-2">
          ✅ TailwindCSS Responsive Test
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="bg-purple-100 p-2 rounded text-purple-800 text-sm">
            Mobile: 1 column
          </div>
          <div className="bg-purple-100 p-2 rounded text-purple-800 text-sm">
            Desktop: 2 columns
          </div>
        </div>
      </div>

      {/* Test component composition */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          ✅ Component Composition Test
        </h2>
        <p className="text-gray-600 text-sm">
          This component successfully demonstrates:
        </p>
        <ul className="list-disc list-inside text-gray-600 text-sm mt-2 space-y-1">
          <li>React 18 hooks (useState)</li>
          <li>SWR data fetching</li>
          <li>TailwindCSS utility classes</li>
          <li>TypeScript integration</li>
          <li>Responsive design</li>
        </ul>
      </div>
    </div>
  );
}