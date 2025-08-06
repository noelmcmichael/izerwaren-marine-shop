'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, Package, Users, Shield, Award } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const stats = [
    { label: 'Products', value: '947+', icon: Package },
    { label: 'Categories', value: '17', icon: Shield },
    { label: 'Pro Account Customers', value: '1000+', icon: Users },
    { label: 'Years Experience', value: '25+', icon: Award }
  ];

  return (
    <div className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-blue-50 opacity-20"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="text-center">
          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Professional{' '}
            <span className="text-blue-600">Marine Hardware</span>
            <br />
            for Every Application
          </h1>
          
          {/* Professional Tagline */}
          <p className="text-xl sm:text-2xl text-gray-600 mb-4 max-w-4xl mx-auto font-semibold">
            Marine grade hardware and fittings for yachts, ships, and ocean residences.
          </p>
          
          {/* Subheading */}
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            From fasteners to marine locks, discover our comprehensive catalog of industrial-grade 
            hardware solutions. Trusted by professionals worldwide.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl leading-6 bg-white/80 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg transition-all duration-200"
                placeholder="Search for marine locks, fasteners, hardware..."
              />
              <button
                type="submit"
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                <ArrowRight className="h-6 w-6 text-gray-400 hover:text-blue-600 transition-colors duration-200" />
              </button>
            </form>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link
              href="/catalog"
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl shadow-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
            >
              Browse Our Catalog
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            
            <Link
              href="/request-quote"
              className="inline-flex items-center px-8 py-4 border border-blue-600 text-lg font-medium rounded-xl text-blue-600 bg-white hover:bg-blue-50 transition-all duration-200 shadow-lg"
            >
              Request Bulk Quote
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-3">
                  <stat.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;