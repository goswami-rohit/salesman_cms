// src/app/api/dashboardPagesAPI/sales-orders/route.ts
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Zod schema for API response validation
const salesOrderSchema = z.object({
  id: z.string().uuid(),
  salesmanName: z.string(),
  salesmanRole: z.string(),
  dealerName: z.string(),
  dealerType: z.string(),
  dealerPhone: z.string(),
  dealerAddress: z.string(),
  area: z.string(),
  region: z.string(),
  quantity: z.number(),
  unit: z.string(),
  orderTotal: z.number(),
  advancePayment: z.number(),
  pendingPayment: z.number(),
  estimatedDelivery: z.string(), // YYYY-MM-DD
  remarks: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Roles allowed to access Sales Orders
const allowedRoles = [
  'president',
  'senior-general-manager',
  'general-manager',
  'assistant-sales-manager',
  'area-sales-manager',
  'regional-sales-manager',
  'senior-manager',
  'manager',
  'assistant-manager',
  'senior-executive',
  'executive',
  'junior-executive',
];

export async function GET() {
  try {
    const claims = await getTokenClaims();

    // 1. Auth Check
    if (!claims || !claims.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Current User Lookup
    const currentUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
      select: { id: true, role: true, companyId: true },
    });

    // 3. Role Check
    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Your role does not have access to this data.' },
        { status: 403 }
      );
    }

    // 4. Fetch Sales Orders linked to the current user's company
    const salesOrders = await prisma.salesOrder.findMany({
      where: {
        salesman: {
          companyId: currentUser.companyId,
        },
      },
      include: {
        salesman: {
          select: { firstName: true, lastName: true, role: true, email: true },
        },
        dealer: {
          select: {
            name: true,
            type: true,
            phoneNo: true,
            address: true,
            area: true,
            region: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 5. Format + validate response
    const formatted = salesOrders.map((order) => ({
      id: order.id,
      salesmanName:
        `${order.salesman?.firstName || ''} ${order.salesman?.lastName || ''}`.trim() ||
        order.salesman?.email ||
        'Unknown',
      salesmanRole: order.salesman?.role || 'Unknown',
      dealerName: order.dealer?.name || 'Unknown',
      dealerType: order.dealer?.type || 'Unknown',
      dealerPhone: order.dealer?.phoneNo || '',
      dealerAddress: order.dealer?.address || '',
      area: order.dealer?.area || '',
      region: order.dealer?.region || '',
      quantity: order.quantity.toNumber(),
      unit: order.unit,
      orderTotal: order.orderTotal.toNumber(),
      advancePayment: order.advancePayment.toNumber(),
      pendingPayment: order.pendingPayment.toNumber(),
      estimatedDelivery: order.estimatedDelivery.toISOString().split('T')[0],
      remarks: order.remarks,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }));

    const validated = z.array(salesOrderSchema).parse(formatted);

    return NextResponse.json(validated, { status: 200 });
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales orders', details: (error as Error).message },
      { status: 500 }
    );
  }
}
