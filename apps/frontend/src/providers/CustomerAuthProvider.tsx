'use client';
import { config } from '@/lib/config';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from '../components/admin/AuthProvider';

// Customer tier types based on database schema
export type DealerTier = 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';

export interface CustomerProfile {
  id: string;
  firebase_uid: string;
  company_name: string;
  contact_email: string;
  contact_phone?: string;
  tier: DealerTier;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerSession {
  profile: CustomerProfile | null;
  permissions: string[];
  pricing_access: {
    can_view_pricing: boolean;
    can_request_quotes: boolean;
    can_place_orders: boolean;
    has_credit_terms: boolean;
  };
}

interface CustomerAuthContextType {
  // Authentication state
  user: User | null;
  customer: CustomerSession | null;
  loading: boolean;
  authenticated: boolean;
  
  // Authentication actions
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshCustomerData: () => Promise<void>;
  
  // Utility methods
  hasPermission: (permission: string) => boolean;
  getTierBenefits: () => TierBenefits;
  canAccessFeature: (feature: string) => boolean;
}

interface TierBenefits {
  tier: DealerTier;
  features: string[];
  pricing_discount: number;
  min_order_quantity: number;
  credit_terms: boolean;
  priority_support: boolean;
}

const CustomerAuthContext = createContext<CustomerAuthContextType>({
  user: null,
  customer: null,
  loading: true,
  authenticated: false,
  signIn: async () => {},
  signOut: async () => {},
  refreshCustomerData: async () => {},
  hasPermission: () => false,
  getTierBenefits: () => ({
    tier: 'STANDARD',
    features: [],
    pricing_discount: 0,
    min_order_quantity: 1,
    credit_terms: false,
    priority_support: false,
  }),
  canAccessFeature: () => false,
});

export function useCustomerAuth(): CustomerAuthContextType {
  return useContext(CustomerAuthContext);
}

interface CustomerAuthProviderProps {
  children: ReactNode;
}

/**
 * Customer Authentication Provider
 * 
 * Manages B2B customer authentication, tier detection, and permissions.
 * Integrates with Firebase auth and PostgreSQL dealer data.
 */
export function CustomerAuthProvider({ children }: CustomerAuthProviderProps) {
  const { user, loading: authLoading, signIn: firebaseSignIn, signOut: firebaseSignOut } = useAuth();
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Load customer profile when user authenticates
  useEffect(() => {
    async function loadCustomerProfile() {
      if (!user) {
        setCustomer(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        // Development mode mock data
        if (config.environment === 'development' && user.uid === 'dev-admin-123') {
          const mockCustomer: CustomerSession = {
            profile: {
              id: 'dev-dealer-123',
              firebase_uid: 'dev-admin-123',
              company_name: 'Development Marine Supply',
              contact_email: 'admin@dev.local',
              contact_phone: '+1-555-0123',
              tier: 'PREMIUM',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            permissions: [
              'view_pricing',
              'request_quotes',
              'place_orders',
              'view_technical_docs',
              'bulk_ordering',
            ],
            pricing_access: {
              can_view_pricing: true,
              can_request_quotes: true,
              can_place_orders: true,
              has_credit_terms: true,
            },
          };
          
          setCustomer(mockCustomer);
          setLoading(false);
          return;
        }

        // Fetch dealer profile from API
        const response = await fetch(`/api/customers/profile/${user.uid}`, {
          headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
          },
        });

        if (response.ok) {
          const profile: CustomerProfile = await response.json();
          
          const customerSession: CustomerSession = {
            profile,
            permissions: generatePermissions(profile.tier),
            pricing_access: generatePricingAccess(profile.tier, profile.is_active),
          };
          
          setCustomer(customerSession);
        } else {
          console.warn('Failed to load customer profile:', response.status);
          setCustomer(null);
        }
      } catch (error) {
        console.error('Error loading customer profile:', error);
        setCustomer(null);
      } finally {
        setLoading(false);
      }
    }

    loadCustomerProfile();
  }, [user]);

  // Generate permissions based on dealer tier
  const generatePermissions = (tier: DealerTier): string[] => {
    const basePermissions = ['view_products', 'view_pricing'];
    
    switch (tier) {
      case 'ENTERPRISE':
        return [
          ...basePermissions,
          'request_quotes',
          'place_orders',
          'view_technical_docs',
          'bulk_ordering',
          'priority_support',
          'custom_pricing',
          'credit_terms',
          'api_access',
        ];
      case 'PREMIUM':
        return [
          ...basePermissions,
          'request_quotes',
          'place_orders',
          'view_technical_docs',
          'bulk_ordering',
          'priority_support',
        ];
      case 'STANDARD':
      default:
        return [
          ...basePermissions,
          'request_quotes',
          'place_orders',
        ];
    }
  };

  // Generate pricing access based on tier and status
  const generatePricingAccess = (tier: DealerTier, isActive: boolean) => {
    if (!isActive) {
      return {
        can_view_pricing: false,
        can_request_quotes: false,
        can_place_orders: false,
        has_credit_terms: false,
      };
    }

    return {
      can_view_pricing: true,
      can_request_quotes: true,
      can_place_orders: tier !== 'STANDARD' || true, // All tiers can place orders
      has_credit_terms: tier === 'PREMIUM' || tier === 'ENTERPRISE',
    };
  };

  // Check if customer has specific permission
  const hasPermission = (permission: string): boolean => {
    return customer?.permissions.includes(permission) || false;
  };

  // Get tier-specific benefits
  const getTierBenefits = (): TierBenefits => {
    if (!customer?.profile) {
      return {
        tier: 'STANDARD',
        features: [],
        pricing_discount: 0,
        min_order_quantity: 1,
        credit_terms: false,
        priority_support: false,
      };
    }

    const { tier } = customer.profile;
    
    switch (tier) {
      case 'ENTERPRISE':
        return {
          tier,
          features: [
            'Custom pricing agreements',
            'API access for integrations',
            'Dedicated account manager',
            'Priority technical support',
            'Extended credit terms',
            'Bulk shipping discounts',
          ],
          pricing_discount: 15,
          min_order_quantity: 1,
          credit_terms: true,
          priority_support: true,
        };
      case 'PREMIUM':
        return {
          tier,
          features: [
            'Volume pricing discounts',
            'Priority customer support',
            'Technical documentation access',
            'Bulk ordering tools',
            'Extended credit terms',
          ],
          pricing_discount: 10,
          min_order_quantity: 1,
          credit_terms: true,
          priority_support: true,
        };
      case 'STANDARD':
      default:
        return {
          tier,
          features: [
            'Standard pricing',
            'Basic customer support',
            'Order history tracking',
            'Quote requests',
          ],
          pricing_discount: 0,
          min_order_quantity: 1,
          credit_terms: false,
          priority_support: false,
        };
    }
  };

  // Check if customer can access specific feature
  const canAccessFeature = (feature: string): boolean => {
    if (!customer?.profile) return false;
    
    const benefits = getTierBenefits();
    const featureMap: Record<string, boolean> = {
      'bulk_ordering': hasPermission('bulk_ordering'),
      'technical_docs': hasPermission('view_technical_docs'),
      'priority_support': benefits.priority_support,
      'custom_pricing': hasPermission('custom_pricing'),
      'api_access': hasPermission('api_access'),
      'credit_terms': benefits.credit_terms,
    };
    
    return featureMap[feature] || false;
  };

  // Refresh customer data
  const refreshCustomerData = async (): Promise<void> => {
    if (user) {
      setLoading(true);
      // Trigger useEffect to reload customer profile
      const currentUser = user;
      setCustomer(null);
      // This will trigger the useEffect to reload
    }
  };

  // Authentication actions
  const signIn = async (email: string, password: string): Promise<void> => {
    await firebaseSignIn(email, password);
  };

  const signOut = async (): Promise<void> => {
    await firebaseSignOut();
    setCustomer(null);
  };

  const contextValue: CustomerAuthContextType = {
    user,
    customer,
    loading: authLoading || loading,
    authenticated: !!user && !!customer,
    signIn,
    signOut,
    refreshCustomerData,
    hasPermission,
    getTierBenefits,
    canAccessFeature,
  };

  return (
    <CustomerAuthContext.Provider value={contextValue}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export default CustomerAuthProvider;