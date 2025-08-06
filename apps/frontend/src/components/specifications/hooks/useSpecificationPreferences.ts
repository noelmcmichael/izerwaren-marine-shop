import { useState, useEffect } from 'react';
import type { SpecificationPreferences } from '../types';

const PREFERENCES_STORAGE_KEY = 'specification-preferences';

const defaultPreferences: SpecificationPreferences = {
  unitSystem: 'both',
  collapsedCategories: [],
  defaultExpanded: true,
  showAuxiliarySpecs: false,
  highlightChanges: true,
  compactView: false
};

/**
 * Custom hook for managing specification display preferences
 * Persists preferences in localStorage with SSR safety
 */
export function useSpecificationPreferences() {
  const [preferences, setPreferences] = useState<SpecificationPreferences>(defaultPreferences);
  const [mounted, setMounted] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        const parsedPreferences = JSON.parse(stored);
        setPreferences(prev => ({ ...prev, ...parsedPreferences }));
      }
    } catch (error) {
      console.warn('Failed to load specification preferences:', error);
    } finally {
      setMounted(true);
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
      } catch (error) {
        console.warn('Failed to save specification preferences:', error);
      }
    }
  }, [preferences, mounted]);

  // Update specific preference
  const updatePreference = <K extends keyof SpecificationPreferences>(
    key: K,
    value: SpecificationPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  // Toggle category collapsed state
  const toggleCategoryCollapsed = (categoryId: string) => {
    setPreferences(prev => {
      const collapsedCategories = [...prev.collapsedCategories];
      const index = collapsedCategories.indexOf(categoryId);
      
      if (index >= 0) {
        collapsedCategories.splice(index, 1);
      } else {
        collapsedCategories.push(categoryId);
      }
      
      return { ...prev, collapsedCategories };
    });
  };

  // Check if category is collapsed
  const isCategoryCollapsed = (categoryId: string): boolean => {
    return preferences.collapsedCategories.includes(categoryId);
  };

  // Reset preferences to defaults
  const resetPreferences = () => {
    setPreferences(defaultPreferences);
  };

  // Bulk update preferences
  const updatePreferences = (updates: Partial<SpecificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  // Expand all categories
  const expandAllCategories = () => {
    setPreferences(prev => ({ ...prev, collapsedCategories: [] }));
  };

  // Collapse all categories
  const collapseAllCategories = (categoryIds: string[]) => {
    setPreferences(prev => ({ ...prev, collapsedCategories: [...categoryIds] }));
  };

  return {
    preferences,
    mounted, // For SSR safety
    
    // Individual preference updaters
    updatePreference,
    updatePreferences,
    resetPreferences,
    
    // Category-specific helpers
    toggleCategoryCollapsed,
    isCategoryCollapsed,
    expandAllCategories,
    collapseAllCategories,
    
    // Quick actions
    setUnitSystem: (system: SpecificationPreferences['unitSystem']) => 
      updatePreference('unitSystem', system),
    
    setCompactView: (compact: boolean) => 
      updatePreference('compactView', compact),
    
    setShowAuxiliary: (show: boolean) => 
      updatePreference('showAuxiliarySpecs', show),
    
    setHighlightChanges: (highlight: boolean) => 
      updatePreference('highlightChanges', highlight),
  };
}

export default useSpecificationPreferences;