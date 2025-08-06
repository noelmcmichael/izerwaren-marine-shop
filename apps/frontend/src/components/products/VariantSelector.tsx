'use client';

import { ChevronDown, AlertCircle, CheckCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { config } from '@/lib/config';

interface VariantOption {
  value: string;
  label: string;
  price: number;
}

interface VariantConfig {
  label: string;
  required: boolean;
  options: VariantOption[];
}

interface VariantConfiguration {
  hasVariants: boolean;
  variantTypes: string[];
  options: Record<string, VariantConfig>;
  totalCombinations: number;
}

interface VariantSelectorProps {
  sku: string;
  basePrice?: string;
  onVariantChange: (
    selectedVariants: Record<string, string>, 
    isComplete: boolean, 
    finalPrice: number, 
    generatedSku: string
  ) => void;
  className?: string;
}

export default function VariantSelector({ sku, basePrice, onVariantChange, className = '' }: VariantSelectorProps) {
  const [variantConfig, setVariantConfig] = useState<VariantConfiguration | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  

  useEffect(() => {
    const fetchVariantConfig = async () => {
      if (!sku) return;

      setLoading(true);
      setError(null);

      try {
        const apiUrl = config.api.baseUrl === '/api' ? `/api/v1/products/variants/${sku}` : `${config.api.baseUrl}/v1/products/variants/${sku}`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch variant configuration');
        }

        const result = await response.json();
        setVariantConfig(result.data);

        // Initialize selected variants to empty state
        if (result.data?.hasVariants) {
          const initialSelection: Record<string, string> = {};
          // Don't pre-select anything - force user to choose
          setSelectedVariants(initialSelection);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load variant options');
        console.error('Error fetching variant configuration:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVariantConfig();
  }, [sku, config.api.baseUrl]);

  // Calculate if configuration is complete
  const isConfigurationComplete = () => {
    if (!variantConfig?.hasVariants) return true;

    return variantConfig.variantTypes.every(variantType => {
      const config = variantConfig.options[variantType];
      return !config.required || selectedVariants[variantType];
    });
  };

  // Calculate final price with variant adjustments
  const calculateFinalPrice = () => {
    if (!basePrice) return 0;

    const basePriceNum = parseFloat(basePrice.replace(/[^0-9.]/g, ''));
    if (isNaN(basePriceNum)) return 0;

    let priceAdjustment = 0;
    if (variantConfig?.hasVariants) {
      for (const [variantType, selectedValue] of Object.entries(selectedVariants)) {
        const config = variantConfig.options[variantType];
        if (config) {
          const selectedOption = config.options.find(opt => opt.value === selectedValue);
          if (selectedOption) {
            priceAdjustment += selectedOption.price;
          }
        }
      }
    }

    return basePriceNum + priceAdjustment;
  };

  // Generate SKU with variant suffixes
  const generateSku = () => {
    if (!variantConfig?.hasVariants || Object.keys(selectedVariants).length === 0) {
      return sku;
    }

    const variantSuffixes = variantConfig.variantTypes.map(variantType => {
      const selectedValue = selectedVariants[variantType];
      if (!selectedValue) return '';

      // Create short codes for SKU generation
      const shortCodes: Record<string, Record<string, string>> = {
        handing: { left: 'LH', right: 'RH' },
        door_thickness: { '1.5': '15', '1.75': '175', '2': '20', '2.25': '225', '2.5': '25' },
        profile_cylinder: { standard: 'STD', high_security: 'HS' },
        keyed_alike: { yes: 'KA', no: 'IK' },
        rimlock_handing: { left_reverse: 'LHR', right_reverse: 'RHR', left_standard: 'LHS', right_standard: 'RHS' },
        tubular_latch: { passage: 'PASS', privacy: 'PRIV', entry: 'ENTRY' },
        key_rose_thickness: { standard: 'STD', thick: 'THK' },
        magnetic_holder: { square: 'SQ', round: 'RD' },
        glass_thickness: { '0.375': '375', '0.5': '50' }
      };

      const typeShortCodes = shortCodes[variantType];
      return typeShortCodes?.[selectedValue] || selectedValue.toUpperCase();
    }).filter(Boolean);

    return variantSuffixes.length > 0 ? `${sku}-${variantSuffixes.join('-')}` : sku;
  };

  // Handle variant selection change
  const handleVariantChange = (variantType: string, value: string) => {
    const newSelectedVariants = {
      ...selectedVariants,
      [variantType]: value
    };

    setSelectedVariants(newSelectedVariants);

    // Notify parent component
    const isComplete = variantConfig ? variantConfig.variantTypes.every(type => {
      const config = variantConfig.options[type];
      return !config.required || newSelectedVariants[type];
    }) : true;

    const finalPrice = calculateFinalPrice();
    const generatedSku = generateSku();

    onVariantChange(newSelectedVariants, isComplete, finalPrice, generatedSku);
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (loading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} p-4 bg-red-50 border border-red-200 rounded-lg`}>
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  if (!variantConfig?.hasVariants) {
    return null; // No variants to configure
  }

  const isComplete = isConfigurationComplete();
  const finalPrice = calculateFinalPrice();
  const generatedSku = generateSku();

  return (
    <div className={`${className} space-y-6`}>
      {/* Configuration Status */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Product Configuration</h3>
        <div className="flex items-center space-x-2">
          {isComplete ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Configuration Complete</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">Please select all options</span>
            </>
          )}
        </div>
      </div>

      {/* Variant Selection Forms */}
      <div className="space-y-4">
        {variantConfig.variantTypes.map(variantType => {
          const config = variantConfig.options[variantType];
          if (!config) return null;

          const selectedValue = selectedVariants[variantType];
          const selectedOption = config.options.find(opt => opt.value === selectedValue);

          return (
            <div key={variantType} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {config.label}
                {config.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              <div className="relative">
                <select
                  value={selectedValue || ''}
                  onChange={(e) => handleVariantChange(variantType, e.target.value)}
                  className={`block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md ${
                    config.required && !selectedValue ? 'border-red-300 ring-red-500' : ''
                  }`}
                  required={config.required}
                >
                  <option value="">Select {config.label.toLowerCase()}...</option>
                  {config.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                      {option.price > 0 && ` (+${formatPrice(option.price)})`}
                      {option.price < 0 && ` (${formatPrice(option.price)})`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>

              {/* Show price adjustment for selected option */}
              {selectedOption && selectedOption.price !== 0 && (
                <p className="text-sm text-gray-600">
                  Price adjustment: {selectedOption.price > 0 ? '+' : ''}{formatPrice(selectedOption.price)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Configuration Summary */}
      {Object.keys(selectedVariants).length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Configuration Summary</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div>
              <span className="font-medium">SKU:</span> {generatedSku}
            </div>
            {basePrice && (
              <div>
                <span className="font-medium">Price:</span> {formatPrice(finalPrice)}
                {finalPrice !== parseFloat(basePrice.replace(/[^0-9.]/g, '')) && (
                  <span className="text-gray-500 ml-2">
                    (Base: {basePrice})
                  </span>
                )}
              </div>
            )}
            <div>
              <span className="font-medium">Total Combinations:</span> {variantConfig.totalCombinations}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}