// Utility functions for variant SKU generation and combination logic

import { VariantGroup, VariantOption } from './types';

export interface VariantCombination {
  [groupName: string]: string; // groupName -> optionValue
}

export interface VariantSelectionMap {
  [groupName: string]: VariantOption;
}

// Generate all possible combinations from variant groups
export function generateVariantCombinations(
  variants: Record<string, VariantGroup>
): VariantCombination[] {
  const groupNames = Object.keys(variants);
  const combinations: VariantCombination[] = [];

  function generateRecursive(currentCombination: VariantCombination, groupIndex: number) {
    if (groupIndex >= groupNames.length) {
      combinations.push({ ...currentCombination });
      return;
    }

    const groupName = groupNames[groupIndex];
    const group = variants[groupName];

    for (const option of group.options) {
      currentCombination[groupName] = option.value;
      generateRecursive(currentCombination, groupIndex + 1);
    }
  }

  generateRecursive({}, 0);
  return combinations;
}

// Generate a unique SKU for a variant combination
export function generateVariantSku(baseSku: string, combination: VariantCombination): string {
  // Define abbreviation mappings for common variant values
  const abbreviations: Record<string, Record<string, string>> = {
    'Door Thickness': {
      '1 1/2 inch': '1.5',
      '1 3/4 inch': '1.75',
      '2 inch': '2.0',
      '2 1/4 inch': '2.25',
      '2 1/2 inch': '2.5',
    },
    Handing: {
      'Left Hand': 'LH',
      'Right Hand': 'RH',
    },
    'Rimlock Handing': {
      'Left hand inwards': 'LHI',
      'Right hand outwards': 'RHO',
      'Left hand outwards': 'LHO',
      'Right hand inwards': 'RHI',
    },
    'Profile Cylinder Type': {
      'Key-Knob': 'KK',
      'Key-Key': 'KN',
    },
    'Tubular Latch Function': {
      Passage: 'PASS',
      Privacy: 'PRIV',
      Entry: 'ENTRY',
    },
    'Chrome Plating': {
      'Polished Chrome': 'PC',
      'Brushed Chrome': 'BC',
    },
    'Key Rose Thickness': {
      Standard: 'STD',
      Thick: 'THK',
    },
    'Magnetic Door Holder Light Duty': {
      'Light Duty': 'LD',
      'Heavy Duty': 'HD',
    },
  };

  const suffixes: string[] = [];

  // Order groups consistently for predictable SKUs
  const orderedGroups = [
    'Door Thickness',
    'Handing',
    'Rimlock Handing',
    'Profile Cylinder Type',
    'Tubular Latch Function',
    'Chrome Plating',
    'Key Rose Thickness',
    'Magnetic Door Holder Light Duty',
    'Keyed alike',
    'Glass Thickness for Strike Box #82.1124',
  ];

  for (const groupName of orderedGroups) {
    if (combination[groupName]) {
      const value = combination[groupName];
      const abbreviation = abbreviations[groupName]?.[value];

      if (abbreviation) {
        suffixes.push(abbreviation);
      } else {
        // Fallback: create abbreviation from first letters
        const fallbackAbbrev = value
          .split(' ')
          .map(word => word.charAt(0).toUpperCase())
          .join('');
        suffixes.push(fallbackAbbrev);
      }
    }
  }

  return `${baseSku}-${suffixes.join('-')}`;
}

// Generate a human-readable title for a variant
export function generateVariantTitle(baseTitle: string, combination: VariantCombination): string {
  const parts = [baseTitle];

  // Add variant selections to title
  const selections = Object.entries(combination).map(([group, value]) => {
    return `${value}`;
  });

  if (selections.length > 0) {
    parts.push(`(${selections.join(', ')})`);
  }

  return parts.join(' ');
}

// Create URL-friendly handle from SKU and variants
export function generateVariantHandle(baseSku: string, combination: VariantCombination): string {
  const variantSku = generateVariantSku(baseSku, combination);
  return variantSku.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

// Calculate price with variant modifiers
export function calculateVariantPrice(
  basePrice: number,
  combination: VariantCombination,
  priceModifiers?: Record<string, Record<string, number>>
): number {
  let totalModifier = 0;

  if (priceModifiers) {
    for (const [groupName, value] of Object.entries(combination)) {
      const modifier = priceModifiers[groupName]?.[value] || 0;
      totalModifier += modifier;
    }
  }

  return basePrice + totalModifier;
}

// Validate that a combination is complete (all required groups have selections)
export function isVariantCombinationComplete(
  combination: VariantCombination,
  variants: Record<string, VariantGroup>,
  requiredGroups?: string[]
): boolean {
  const required = requiredGroups || Object.keys(variants);

  for (const groupName of required) {
    if (!combination[groupName]) {
      return false;
    }
  }

  return true;
}

// Find a variant option by group name and value
export function findVariantOption(
  variants: Record<string, VariantGroup>,
  groupName: string,
  value: string
): VariantOption | null {
  const group = variants[groupName];
  if (!group) return null;

  return group.options.find(option => option.value === value) || null;
}
