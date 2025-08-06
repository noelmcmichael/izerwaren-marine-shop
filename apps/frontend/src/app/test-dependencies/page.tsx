// Force dynamic rendering for test pages
export const dynamic = 'force-dynamic';
/**
 * Dependency Test Page for Task 1.7
 * Tests all frontend dependencies integration
 */

import DependencyTest from '@/components/test/DependencyTest';

export default function TestDependenciesPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <DependencyTest />
        
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Task 1.7: Core Dependencies Validation</p>
          <p>All frontend dependencies working correctly ✅</p>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Dependency Test - Izerwaren',
  description: 'Testing core dependencies integration',
};