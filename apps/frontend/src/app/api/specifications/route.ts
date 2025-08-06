import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * GET /api/specifications - Fetch technical specifications for products
 * Part of Task 10 - Technical Specifications Display System
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const categoryIds = searchParams.get('categoryIds')?.split(',');
    const importance = searchParams.get('importance')?.split(',');
    const searchTerm = searchParams.get('search');
    const unitSystem = searchParams.get('unitSystem') || 'metric';

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Mock data for now - this would query the database in real implementation
    const mockSpecifications = [
      {
        id: 'spec-1',
        productId,
        categoryId: 'physical-dimensions',
        name: 'Length',
        value: '150',
        unit: 'mm',
        description: 'Overall length of the hardware',
        dataType: 'NUMERIC',
        displayOrder: 1,
        importance: 'CRITICAL',
        isHighlighted: true,
        isSearchable: true,
        isComparable: true,
        numericValue: 150,
        version: 1,
        lastModified: new Date(),
        isValidated: true,
        category: {
          id: 'physical-dimensions',
          name: 'physical_dimensions',
          displayName: 'Physical Dimensions',
          description: 'Size and dimensional specifications',
          displayOrder: 1,
          icon: '📏',
          isCollapsible: true,
          isActiveByDefault: true,
          importance: 'CRITICAL',
          applicableTypes: ['hardware', 'marine']
        }
      },
      {
        id: 'spec-2',
        productId,
        categoryId: 'physical-dimensions',
        name: 'Width',
        value: '75',
        unit: 'mm',
        description: 'Overall width of the hardware',
        dataType: 'NUMERIC',
        displayOrder: 2,
        importance: 'CRITICAL',
        isHighlighted: false,
        isSearchable: true,
        isComparable: true,
        numericValue: 75,
        version: 1,
        lastModified: new Date(),
        isValidated: true,
        category: {
          id: 'physical-dimensions',
          name: 'physical_dimensions',
          displayName: 'Physical Dimensions',
          description: 'Size and dimensional specifications',
          displayOrder: 1,
          icon: '📏',
          isCollapsible: true,
          isActiveByDefault: true,
          importance: 'CRITICAL',
          applicableTypes: ['hardware', 'marine']
        }
      },
      {
        id: 'spec-3',
        productId,
        categoryId: 'materials',
        name: 'Material',
        value: '316 Stainless Steel',
        description: 'Marine grade stainless steel construction',
        dataType: 'TEXT',
        displayOrder: 1,
        importance: 'IMPORTANT',
        isHighlighted: true,
        isSearchable: true,
        isComparable: true,
        version: 1,
        lastModified: new Date(),
        isValidated: true,
        category: {
          id: 'materials',
          name: 'materials',
          displayName: 'Materials & Construction',
          description: 'Material composition and construction details',
          displayOrder: 2,
          icon: '🔧',
          isCollapsible: true,
          isActiveByDefault: true,
          importance: 'IMPORTANT',
          applicableTypes: ['hardware', 'marine']
        }
      },
      {
        id: 'spec-4',
        productId,
        categoryId: 'performance',
        name: 'Load Rating',
        value: '500',
        unit: 'kg',
        description: 'Maximum load capacity',
        dataType: 'NUMERIC',
        displayOrder: 1,
        importance: 'IMPORTANT',
        isHighlighted: false,
        isSearchable: true,
        isComparable: true,
        numericValue: 500,
        version: 1,
        lastModified: new Date(),
        isValidated: true,
        category: {
          id: 'performance',
          name: 'performance',
          displayName: 'Performance Specifications',
          description: 'Load ratings and performance characteristics',
          displayOrder: 3,
          icon: '⚡',
          isCollapsible: true,
          isActiveByDefault: true,
          importance: 'IMPORTANT',
          applicableTypes: ['hardware', 'marine']
        }
      },
      {
        id: 'spec-5',
        productId,
        categoryId: 'environmental',
        name: 'Corrosion Resistance',
        value: 'Salt Water Rated',
        description: 'Suitable for marine environments with salt water exposure',
        dataType: 'TEXT',
        displayOrder: 1,
        importance: 'CRITICAL',
        isHighlighted: true,
        isSearchable: true,
        isComparable: true,
        version: 1,
        lastModified: new Date(),
        isValidated: true,
        category: {
          id: 'environmental',
          name: 'environmental',
          displayName: 'Environmental Ratings',
          description: 'Environmental resistance and ratings',
          displayOrder: 4,
          icon: '🌊',
          isCollapsible: true,
          isActiveByDefault: true,
          importance: 'CRITICAL',
          applicableTypes: ['hardware', 'marine']
        }
      }
    ];

    // Filter specifications based on query parameters
    let filteredSpecs = mockSpecifications;

    if (categoryIds && categoryIds.length > 0) {
      filteredSpecs = filteredSpecs.filter(spec => 
        categoryIds.includes(spec.categoryId)
      );
    }

    if (importance && importance.length > 0) {
      filteredSpecs = filteredSpecs.filter(spec => 
        importance.includes(spec.importance)
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredSpecs = filteredSpecs.filter(spec => 
        spec.name.toLowerCase().includes(term) ||
        spec.value.toLowerCase().includes(term) ||
        (spec.description && spec.description.toLowerCase().includes(term))
      );
    }

    // Get unique categories
    const categories = Array.from(
      new Map(
        mockSpecifications.map(spec => [spec.categoryId, spec.category])
      ).values()
    );

    const response = {
      specifications: filteredSpecs,
      categories,
      totalCount: mockSpecifications.length,
      filteredCount: filteredSpecs.length,
      unitConversions: [
        {
          id: 'conv-1',
          specificationId: 'spec-1',
          fromUnit: 'mm',
          toUnit: 'in',
          conversionFactor: 0.0393701,
          conversionOffset: 0,
          displayFormat: '0.00'
        },
        {
          id: 'conv-2',
          specificationId: 'spec-2',
          fromUnit: 'mm',
          toUnit: 'in',
          conversionFactor: 0.0393701,
          conversionOffset: 0,
          displayFormat: '0.00'
        },
        {
          id: 'conv-3',
          specificationId: 'spec-4',
          fromUnit: 'kg',
          toUnit: 'lbs',
          conversionFactor: 2.20462,
          conversionOffset: 0,
          displayFormat: '0.0'
        }
      ]
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching specifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch specifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/specifications - Update specifications
 */
export async function POST(request: NextRequest) {
  try {
    const updates = await request.json();
    
    // Mock update logic - this would update the database in real implementation
    console.log('Specification updates received:', updates);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Specifications updated successfully' 
    });

  } catch (error) {
    console.error('Error updating specifications:', error);
    return NextResponse.json(
      { error: 'Failed to update specifications' },
      { status: 500 }
    );
  }
}