import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CustomerUpdateSchema = z.object({
  company_name: z.string().min(1).optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  tier: z.enum(['STANDARD', 'PREMIUM', 'ENTERPRISE']).optional(),
});

/**
 * GET /api/customers/profile/[uid]
 * Get customer profile by Firebase UID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const { uid } = params;

    // TODO: Verify authentication token
    // const user = await authenticateCustomer(request);
    // if (user.uid !== uid && !user.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    // Mock customer data for development
    const mockCustomer = {
      id: 'customer-123',
      firebase_uid: uid,
      company_name: 'Marine Supply Co.',
      contact_email: 'contact@marinesupply.com',
      contact_phone: '+1-555-0123',
      tier: 'PREMIUM',
      is_active: true,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
    };

    return NextResponse.json({ data: mockCustomer });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer profile' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/customers/profile/[uid]
 * Update customer profile
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const { uid } = params;
    const body = await request.json();
    const validatedData = CustomerUpdateSchema.parse(body);

    // TODO: Verify authentication token
    // const user = await authenticateCustomer(request);
    // if (user.uid !== uid && !user.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    // TODO: Update customer in database
    const updatedCustomer = {
      id: 'customer-123',
      firebase_uid: uid,
      company_name: 'Marine Supply Co.',
      contact_email: 'contact@marinesupply.com',
      contact_phone: '+1-555-0123',
      tier: 'PREMIUM',
      is_active: true,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: new Date().toISOString(),
      ...validatedData,
    };

    return NextResponse.json({
      data: updatedCustomer,
      message: 'Profile updated successfully',
    });
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

    console.error('Error updating customer profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}