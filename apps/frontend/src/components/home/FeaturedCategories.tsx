'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Lock, Zap, Wrench, Anchor, Settings, Shield } from 'lucide-react';

interface CategoryItem {
  name: string;
  description: string;
  href: string;
  icon: React.ElementType;
  productCount: string;
  image?: string;
}

export const FeaturedCategories: React.FC = () => {
  const featuredCategories: CategoryItem[] = [
    {
      name: 'Marine Locks',
      description: 'Cam locks, barrel locks, and security hardware for marine applications',
      href: '/catalog?category=MARINE%20LOCKS',
      icon: Lock,
      productCount: '150+'
    },
    {
      name: 'Fasteners',
      description: 'High-grade bolts, screws, nuts, and marine-grade fastening solutions',
      href: '/catalog?category=FASTENERS',
      icon: Settings,
      productCount: '200+'
    },
    {
      name: 'Hardware',
      description: 'General marine hardware, fittings, and mechanical components',
      href: '/catalog?category=HARDWARE',
      icon: Wrench,
      productCount: '180+'
    },
    {
      name: 'Marine Electronics',
      description: 'Electrical components, connectors, and marine electronic accessories',
      href: '/catalog?category=electronics',
      icon: Zap,
      productCount: '120+'
    },
    {
      name: 'Anchoring & Mooring',
      description: 'Anchors, chains, ropes, and mooring hardware for all vessel types',
      href: '/catalog?category=anchoring',
      icon: Anchor,
      productCount: '90+'
    },
    {
      name: 'Safety Equipment',
      description: 'Marine safety gear, emergency equipment, and protective hardware',
      href: '/catalog?category=safety',
      icon: Shield,
      productCount: '75+'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our comprehensive range of marine hardware organized by application. 
            Find exactly what you need for your project.
          </p>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {featuredCategories.map((category, index) => (
            <Link
              key={index}
              href={category.href}
              className="group relative bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300"
            >
              {/* Category icon */}
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4 group-hover:bg-blue-200 transition-colors duration-200">
                <category.icon className="h-6 w-6 text-blue-600" />
              </div>

              {/* Category info */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {category.description}
                </p>
              </div>

              {/* Product count and arrow */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-600">
                  {category.productCount} products
                </span>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200" />
              </div>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
            </Link>
          ))}
        </div>

        {/* View all categories CTA */}
        <div className="text-center">
          <Link
            href="/catalog"
            className="inline-flex items-center px-6 py-3 border border-blue-600 text-base font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition-all duration-200"
          >
            View All Categories
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;