// src/app/api/dashboardPagesAPI/reports/sales-orders/route.ts
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Zod schema for API response validation
export const salesOrderSchema = z.object({
  // Primary & FKs
  id: z.string(),
  userId: z.number().nullable(),
  dealerId: z.string().nullable(),
  dvrId: z.string().nullable(),
  pjpId: z.string().nullable(),

  // Denormalized display fields (nice for UI)
  salesmanName: z.string(),
  salesmanRole: z.string(),
  dealerName: z.string(),
  dealerType: z.string(),
  dealerPhone: z.string(),
  dealerAddress: z.string(),
  area: z.string(),
  region: z.string(),

  // Business fields (raw)
  orderDate: z.string(),                      // YYYY-MM-DD
  orderPartyName: z.string(),

  partyPhoneNo: z.string().nullable(),
  partyArea: z.string().nullable(),
  partyRegion: z.string().nullable(),
  partyAddress: z.string().nullable(),

  deliveryDate: z.string().nullable(),        // YYYY-MM-DD or null
  deliveryArea: z.string().nullable(),
  deliveryRegion: z.string().nullable(),
  deliveryAddress: z.string().nullable(),
  deliveryLocPincode: z.string().nullable(),

  paymentMode: z.string().nullable(),
  paymentTerms: z.string().nullable(),
  paymentAmount: z.number().nullable(),
  receivedPayment: z.number().nullable(),
  receivedPaymentDate: z.string().nullable(), // YYYY-MM-DD or null
  pendingPayment: z.number().nullable(),

  orderQty: z.number().nullable(),
  orderUnit: z.string().nullable(),

  itemPrice: z.number().nullable(),
  discountPercentage: z.number().nullable(),
  itemPriceAfterDiscount: z.number().nullable(),

  itemType: z.string().nullable(),
  itemGrade: z.string().nullable(),

  // Convenience/computed
  orderTotal: z.number(),                      // qty * effective price
  estimatedDelivery: z.string().nullable(),    // alias of deliveryDate for your UI
  remarks: z.string().nullable(),              // not in DB, stays null for compat

  // Timestamps
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Roles allowed to access Sales Orders
const allowedRoles = ['president', 'senior-general-manager', 'general-manager',
  'assistant-sales-manager', 'area-sales-manager', 'regional-sales-manager',
  'senior-manager', 'manager', 'assistant-manager',
  'senior-executive', 'executive', 'junior-executive'];

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
        user: {
          companyId: currentUser.companyId,
        },
      },
      include: {
        user: {
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

    // 5) Format -> plain JSON
    const formatted = salesOrders.map((order) => {
      const toNum = (v: any) => (v == null ? null : Number(v));
      const toDate = (d: any) => (d ? new Date(d).toISOString().split('T')[0] : null);

      const qty = toNum(order.orderQty) ?? 0;
      // effective unit price: prefer after-discount, else base price, else 0
      const effPrice =
        toNum(order.itemPriceAfterDiscount) ??
        toNum(order.itemPrice) ??
        0;

      const orderTotal = Number((qty * effPrice).toFixed(2));

      const receivedPayment = toNum(order.receivedPayment);
      const pendingPayment =
        order.pendingPayment != null
          ? toNum(order.pendingPayment)
          : Number((orderTotal - (receivedPayment ?? 0)).toFixed(2));

      const salesmanName =
        `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() ||
        order.user?.email ||
        'Unknown';

      return {
        // IDs
        id: order.id,
        userId: order.userId ?? null,
        dealerId: order.dealerId ?? null,
        dvrId: order.dvrId ?? null,
        pjpId: order.pjpId ?? null,

        // Display fields
        salesmanName,
        salesmanRole: order.user?.role || 'Unknown',
        dealerName: order.dealer?.name || 'Unknown',
        dealerType: order.dealer?.type || 'Unknown',
        dealerPhone: order.dealer?.phoneNo || '',
        dealerAddress: order.dealer?.address || '',
        area: order.dealer?.area || '',
        region: order.dealer?.region || '',

        // Business fields (raw)
        orderDate: toDate(order.orderDate) as string, // not null by schema
        orderPartyName: order.orderPartyName,

        partyPhoneNo: order.partyPhoneNo ?? null,
        partyArea: order.partyArea ?? null,
        partyRegion: order.partyRegion ?? null,
        partyAddress: order.partyAddress ?? null,

        deliveryDate: toDate(order.deliveryDate),
        deliveryArea: order.deliveryArea ?? null,
        deliveryRegion: order.deliveryRegion ?? null,
        deliveryAddress: order.deliveryAddress ?? null,
        deliveryLocPincode: order.deliveryLocPincode ?? null,

        paymentMode: order.paymentMode ?? null,
        paymentTerms: order.paymentTerms ?? null,
        paymentAmount: toNum(order.paymentAmount),
        receivedPayment,
        receivedPaymentDate: toDate(order.receivedPaymentDate),
        pendingPayment,

        orderQty: toNum(order.orderQty),
        orderUnit: order.orderUnit ?? null,

        itemPrice: toNum(order.itemPrice),
        discountPercentage: toNum(order.discountPercentage),
        itemPriceAfterDiscount: toNum(order.itemPriceAfterDiscount),

        itemType: order.itemType ?? null,
        itemGrade: order.itemGrade ?? null,

        // Convenience/computed
        orderTotal,
        estimatedDelivery: toDate(order.deliveryDate),
        remarks: null,

        // Timestamps
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      };
    });

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
