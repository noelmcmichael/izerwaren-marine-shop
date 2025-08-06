'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Mail, Lock, Eye, EyeOff, Building2, ArrowRight, Shield, Truck, DollarSign } from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    contactName: '',
    phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo authentication - always succeed
    if (isLogin) {
      // Simulate login success
      sessionStorage.setItem('demo_mode', 'true');
      window.location.href = '/dashboard?demo=true';
    } else {
      // Simulate signup success
      alert('Account created successfully! You can now log in.');
      setIsLogin(true);
    }
  };

  const demoLogin = () => {
    setFormData({
      ...formData,
      email: 'demo@marine-supply.com',
      password: 'demo123'
    });
    // Set demo mode and redirect
    sessionStorage.setItem('demo_mode', 'true');
    setTimeout(() => {
      window.location.href = '/dashboard?demo=true';
    }, 500);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="flex min-h-screen">
        {/* Left side - Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <Building2 className="h-8 w-8 text-blue-600 mr-2" />
                  <h1 className="text-2xl font-bold text-gray-900">Pro Account Portal</h1>
                </div>
                <p className="text-gray-600">
                  {isLogin ? 'Sign in to your professional account' : 'Create your Pro Account'}
                </p>
              </div>

              {/* Demo Account Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-900 mb-1">Try Demo Account</h3>
                    <p className="text-xs text-blue-800 mb-2">
                      Explore Pro Account features with full access
                    </p>
                    <button
                      onClick={demoLogin}
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Access Demo Account
                    </button>
                  </div>
                </div>
              </div>

              {/* Toggle Login/Signup */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    isLogin 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    !isLogin 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your Company"
                        required={!isLogin}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        value={formData.contactName}
                        onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your Name"
                        required={!isLogin}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="(555) 123-4567"
                        required={!isLogin}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="your@company.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                >
                  {isLogin ? 'Sign In' : 'Create Pro Account'}
                  <ArrowRight className="inline-block ml-2 h-4 w-4" />
                </button>
              </form>

              {isLogin && (
                <div className="mt-4 text-center">
                  <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                    Forgot your password?
                  </Link>
                </div>
              )}

              <div className="mt-6 text-center text-sm text-gray-600">
                <Link href="/" className="text-blue-600 hover:text-blue-800">
                  ← Back to Izerwaren
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Benefits */}
        <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center p-8">
          <div className="max-w-md text-white">
            <h2 className="text-3xl font-bold mb-6">Pro Account Benefits</h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <DollarSign className="h-6 w-6 mr-4 mt-1 text-blue-200" />
                <div>
                  <h3 className="font-semibold mb-2">Volume Pricing</h3>
                  <p className="text-blue-100">
                    Access discounted pricing tiers based on order volume and account status.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Truck className="h-6 w-6 mr-4 mt-1 text-blue-200" />
                <div>
                  <h3 className="font-semibold mb-2">Priority Shipping</h3>
                  <p className="text-blue-100">
                    Expedited processing and shipping on all orders with tracking included.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Shield className="h-6 w-6 mr-4 mt-1 text-blue-200" />
                <div>
                  <h3 className="font-semibold mb-2">Dedicated Support</h3>
                  <p className="text-blue-100">
                    Priority technical support and dedicated account management.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-700 rounded-lg">
              <h4 className="font-semibold mb-2">Ready to get started?</h4>
              <p className="text-sm text-blue-100">
                Join over 1000+ marine professionals who trust Izerwaren for their hardware needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}