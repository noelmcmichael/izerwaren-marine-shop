'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';

/**
 * Pro Account Dashboard
 * 
 * Main dashboard for authenticated Pro customers showing:
 * - Account information and tier status
 * - Pricing benefits and discounts
 * - Quick actions (orders, quotes, etc.)
 * - Recent activity
 */
export default function CustomerDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock demo customer data
  const mockCustomer = {
    profile: {
      id: 'demo-customer',
      company_name: 'Marine Supply Co.',
      contact_email: 'demo@marine-supply.com',
      contact_phone: '(555) 123-4567',
      tier: 'PREMIUM',
      is_active: true,
      created_at: '2023-01-15T00:00:00Z'
    }
  };

  const mockTierBenefits = {
    tier: 'PREMIUM',
    pricing_discount: 15,
    credit_terms: true,
    priority_support: true,
    features: [
      'Volume-based pricing discounts',
      'Priority order processing',
      'Dedicated account manager',
      'Extended payment terms',
      'Technical support hotline',
      'Free shipping on orders over $500'
    ]
  };

  useEffect(() => {
    // Check if user came from demo login or has demo session
    const isDemoMode = sessionStorage.getItem('demo_mode') === 'true' || 
                      window.location.search.includes('demo=true');
    
    setLoading(false);
    setAuthenticated(isDemoMode);
  }, []);

  const signOut = () => {
    sessionStorage.removeItem('demo_mode');
    window.location.href = '/';
  };

  const hasPermission = (permission: string) => true; // Demo mode has all permissions

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Access Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please sign in to access your Pro Account dashboard.
            </p>
            <button 
              onClick={() => window.location.href = '/login'}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tierBenefits = mockTierBenefits;
  const profile = mockCustomer.profile;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {profile.company_name}
              </h1>
              <p className="text-sm text-gray-600">
                {profile.contact_email} • {profile.tier} Member
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                profile.tier === 'ENTERPRISE' ? 'bg-purple-100 text-purple-800' :
                profile.tier === 'PREMIUM' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {profile.tier} Tier
              </span>
              <button
                onClick={signOut}
                className="text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Account Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Account Overview
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Company</label>
                    <p className="text-gray-900">{profile.company_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Contact Email</label>
                    <p className="text-gray-900">{profile.contact_email}</p>
                  </div>
                  {profile.contact_phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-900">{profile.contact_phone}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Member Since</label>
                    <p className="text-gray-900">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Account Status</label>
                    <p className={`font-medium ${
                      profile.is_active ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {profile.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                  disabled={!hasPermission('place_orders')}
                >
                  <div className="text-blue-600 mb-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900">Browse Products</h3>
                  <p className="text-sm text-gray-500">View catalog with your pricing</p>
                </button>
                
                <button 
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                  disabled={!hasPermission('request_quotes')}
                >
                  <div className="text-green-600 mb-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900">Request Quote</h3>
                  <p className="text-sm text-gray-500">Get custom pricing</p>
                </button>
                
                <button 
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="text-purple-600 mb-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900">Order History</h3>
                  <p className="text-sm text-gray-500">View past orders</p>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Activity
              </h2>
              
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>No recent activity</p>
                <p className="text-sm">Your orders and quotes will appear here</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Tier Benefits */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {tierBenefits.tier} Benefits
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pricing Discount</span>
                  <span className="font-medium text-green-600">
                    {tierBenefits.pricing_discount}%
                  </span>
                </div>
                
                {tierBenefits.credit_terms && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Credit Terms</span>
                    <span className="text-green-600">✓</span>
                  </div>
                )}
                
                {tierBenefits.priority_support && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Priority Support</span>
                    <span className="text-green-600">✓</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-2">Features</h4>
                <ul className="space-y-1">
                  {tierBenefits.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center">
                      <span className="text-green-500 mr-2">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {profile.tier !== 'ENTERPRISE' && (
                <div className="mt-4 pt-4 border-t">
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm hover:bg-blue-700">
                    Upgrade Tier
                  </button>
                </div>
              )}
            </div>

            {/* Support */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Need Help?
              </h3>
              
              <div className="space-y-3">
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="font-medium text-gray-900">Contact Support</div>
                  <div className="text-sm text-gray-500">
                    {tierBenefits.priority_support ? 'Priority support available' : 'Standard support'}
                  </div>
                </button>
                
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="font-medium text-gray-900">Documentation</div>
                  <div className="text-sm text-gray-500">Browse help articles</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}