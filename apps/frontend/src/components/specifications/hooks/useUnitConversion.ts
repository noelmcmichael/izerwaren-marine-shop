import { useState, useEffect, useMemo } from 'react';
import type { UnitConversion, StandardUnit, SpecificationPreferences } from '../types';

/**
 * Custom hook for unit conversion functionality
 * Handles metric/imperial conversions for specifications
 */
export function useUnitConversion() {
  const [standardUnits, setStandardUnits] = useState<StandardUnit[]>([]);
  const [conversionRates, setConversionRates] = useState<Map<string, UnitConversion[]>>(new Map());
  const [loading, setLoading] = useState(true);

  // Fetch standard units and conversion rates
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setLoading(true);
        
        // Fetch standard units
        const unitsResponse = await fetch('/api/specifications/units');
        if (unitsResponse.ok) {
          const units: StandardUnit[] = await unitsResponse.json();
          setStandardUnits(units);
        }
        
        // Fetch common conversion rates
        const conversionsResponse = await fetch('/api/specifications/conversions');
        if (conversionsResponse.ok) {
          const conversions: UnitConversion[] = await conversionsResponse.json();
          
          // Group conversions by source unit
          const conversionMap = new Map<string, UnitConversion[]>();
          conversions.forEach(conversion => {
            const key = conversion.fromUnit;
            if (!conversionMap.has(key)) {
              conversionMap.set(key, []);
            }
            conversionMap.get(key)!.push(conversion);
          });
          
          setConversionRates(conversionMap);
        }
        
      } catch (error) {
        console.error('Failed to fetch unit conversion data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, []);

  // Convert value between units
  const convertValue = (
    value: number,
    fromUnit: string,
    toUnit: string
  ): { value: number; formatted: string } | null => {
    if (fromUnit === toUnit) {
      return { value, formatted: formatValue(value, toUnit) };
    }

    // Find conversion rate
    const conversions = conversionRates.get(fromUnit);
    const conversion = conversions?.find(c => c.toUnit === toUnit);
    
    if (!conversion) {
      // Try reverse conversion
      const reverseConversions = conversionRates.get(toUnit);
      const reverseConversion = reverseConversions?.find(c => c.fromUnit === fromUnit);
      
      if (reverseConversion) {
        // Apply inverse conversion
        const convertedValue = (value - reverseConversion.conversionOffset) / reverseConversion.conversionFactor;
        return {
          value: convertedValue,
          formatted: formatValue(convertedValue, toUnit, reverseConversion.displayFormat)
        };
      }
      
      return null;
    }

    // Apply conversion: converted = (original * factor) + offset
    const convertedValue = (value * conversion.conversionFactor) + conversion.conversionOffset;
    
    return {
      value: convertedValue,
      formatted: formatValue(convertedValue, toUnit, conversion.displayFormat)
    };
  };

  // Format value with appropriate precision
  const formatValue = (value: number, unit: string, format?: string): string => {
    if (format) {
      // Use custom format if provided
      const decimalPlaces = (format.match(/#+/)?.[0]?.length || 2);
      return value.toFixed(decimalPlaces);
    }

    // Default formatting based on unit type
    const unitInfo = standardUnits.find(u => u.unit === unit);
    
    if (!unitInfo) {
      return value.toString();
    }

    // Different precision for different unit types
    switch (unitInfo.unitType) {
      case 'length':
        return value < 1 ? value.toFixed(3) : value.toFixed(2);
      case 'weight':
        return value < 1 ? value.toFixed(3) : value.toFixed(2);
      case 'force':
        return value.toFixed(1);
      case 'current':
        return value < 1 ? value.toFixed(3) : value.toFixed(2);
      case 'voltage':
        return value.toFixed(1);
      case 'power':
        return value.toFixed(1);
      case 'pressure':
        return value.toFixed(1);
      case 'temperature':
        return value.toFixed(1);
      default:
        return value.toFixed(2);
    }
  };

  // Get preferred unit for a given unit type and system
  const getPreferredUnit = (
    unitType: string, 
    systemType: 'metric' | 'imperial',
    currentUnit: string
  ): string => {
    const units = standardUnits.filter(u => 
      u.unitType === unitType && u.systemType === systemType
    );
    
    if (units.length === 0) {
      return currentUnit;
    }

    // Prefer base units
    const baseUnit = units.find(u => u.isBase);
    if (baseUnit) {
      return baseUnit.unit;
    }

    // Return first available unit
    return units[0].unit;
  };

  // Convert specification value based on preferences
  const convertSpecificationValue = (
    value: string,
    unit: string | undefined,
    preferences: SpecificationPreferences
  ): { value: string; unit: string; converted: boolean } => {
    if (!unit || preferences.unitSystem === 'both') {
      return { value, unit: unit || '', converted: false };
    }

    // Parse numeric value
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      return { value, unit: unit || '', converted: false };
    }

    // Get unit info
    const unitInfo = standardUnits.find(u => u.unit === unit);
    if (!unitInfo) {
      return { value, unit, converted: false };
    }

    // Check if conversion is needed
    const needsConversion = 
      (preferences.unitSystem === 'metric' && unitInfo.systemType === 'imperial') ||
      (preferences.unitSystem === 'imperial' && unitInfo.systemType === 'metric');
    
    if (!needsConversion) {
      return { value, unit, converted: false };
    }

    // Get target unit
    const targetUnit = getPreferredUnit(
      unitInfo.unitType,
      preferences.unitSystem,
      unit
    );

    // Perform conversion
    const converted = convertValue(numericValue, unit, targetUnit);
    if (!converted) {
      return { value, unit, converted: false };
    }

    return {
      value: converted.formatted,
      unit: targetUnit,
      converted: true
    };
  };

  // Get available conversions for a unit
  const getAvailableConversions = (unit: string): UnitConversion[] => {
    return conversionRates.get(unit) || [];
  };

  // Get unit system for a given unit
  const getUnitSystem = (unit: string): 'metric' | 'imperial' | 'unknown' => {
    const unitInfo = standardUnits.find(u => u.unit === unit);
    return unitInfo?.systemType || 'unknown';
  };

  // Get display name for unit
  const getUnitDisplayName = (unit: string): string => {
    const unitInfo = standardUnits.find(u => u.unit === unit);
    return unitInfo?.displayName || unit;
  };

  // Get symbol for unit
  const getUnitSymbol = (unit: string): string => {
    const unitInfo = standardUnits.find(u => u.unit === unit);
    return unitInfo?.symbol || unit;
  };

  return {
    // Data
    standardUnits,
    conversionRates,
    loading,
    
    // Conversion functions
    convertValue,
    convertSpecificationValue,
    formatValue,
    
    // Unit helpers
    getPreferredUnit,
    getAvailableConversions,
    getUnitSystem,
    getUnitDisplayName,
    getUnitSymbol,
    
    // Utils
    canConvert: (fromUnit: string, toUnit: string) => {
      return conversionRates.has(fromUnit) && 
        conversionRates.get(fromUnit)?.some(c => c.toUnit === toUnit) ||
        conversionRates.has(toUnit) && 
        conversionRates.get(toUnit)?.some(c => c.fromUnit === fromUnit);
    }
  };
}

export default useUnitConversion;