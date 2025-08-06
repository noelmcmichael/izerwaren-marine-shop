import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const CustomerCreateSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  contact_email: z.string().email('Valid email is required'),
  contact_phone: z.string().optional(),
  tier: z.enum(['STANDARD', 'PREMIUM', 'ENTERPRISE']).default('STANDARD'),
});

const CustomerUpdateSchema = CustomerCreateSchema.partial();

/**
 * GET /api/customers
 * Retrieve customers (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const tier = searchParams.get('tier');
    const active = searchParams.get('active');

    // TODO: Implement admin authentication check
    // const user = await authenticateAdmin(request);
    
    // Mock response for development
    const mockCustomers = [
      {
        id: 'customer-1',
        firebase_uid: 'firebase-123',
        company_name: 'Marine Supply Co.',
        contact_email: 'contact@marinesupply.com',
        contact_phone: '+1-555-0123',
        tier: 'PREMIUM',
        is_active: true,
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      },
      {
        id: 'customer-2',
        firebase_uid: 'firebase-456',
        company_name: 'Ocean Hardware Ltd.',
        contact_email: 'admin@oceanhardware.com',
        tier: 'ENTERPRISE',
        is_active: true,
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-10T00:00:00Z',
      },
    ];

    // Apply filters
    let filtered = mockCustomers;
    if (tier) {
      filtered = filtered.filter(c => c.tier === tier);
    }
    if (active !== null) {
      filtered = filtered.filter(c => c.is_active === (active === 'true'));
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCustomers = filtered.slice(startIndex, endIndex);

    return NextResponse.json({
      data: paginatedCustomers,
      pagination: {
        page,
        limit,
        total: filtered.length,
        pages: Math.ceil(filtered.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/customers
 * Create a new customer (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CustomerCreateSchema.parse(body);

    // TODO: Implement admin authentication check
    // const user = await authenticateAdmin(request);

    // TODO: Create customer in database
    const mockCustomer = {
      id: `customer-${Date.now()}`,
      firebase_uid: body.firebase_uid || null,
      ...validatedData,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      data: mockCustomer,
      message: 'Customer created successfully',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}