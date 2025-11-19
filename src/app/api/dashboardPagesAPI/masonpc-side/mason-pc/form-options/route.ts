// src/app/api/dashboardPagesAPI/masonpc-side/form-options/route.ts
import 'server-only';
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';

export async function GET() {
  try {
    // 1. Auth Check (Optional: Add your role checks here if needed)
    const claims = await getTokenClaims();
    if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2. Fetch Data in Parallel
    const [technicalUsers, dealers, sites] = await Promise.all([
      // A. Fetch Users with isTechnicalRole = true
      prisma.user.findMany({
        where: { isTechnicalRole: true, status: 'active' },
        select: { id: true, firstName: true, lastName: true },
        orderBy: { firstName: 'asc' }
      }),

      // B. Fetch Dealers
      prisma.dealer.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      }),

      // C. Fetch Technical Sites
      prisma.technicalSite.findMany({
        select: { id: true, siteName: true },
        orderBy: { siteName: 'asc' }
      })
    ]);

    // 3. Format for UI
    return NextResponse.json({
      users: technicalUsers.map(u => ({ 
        id: u.id, 
        name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'Unknown' 
      })),
      dealers: dealers.map(d => ({ id: d.id, name: d.name })),
      sites: sites.map(s => ({ id: s.id, name: s.siteName })),
    });

  } catch (error) {
    console.error('Error fetching form options:', error);
    return NextResponse.json({ error: 'Failed to fetch options' }, { status: 500 });
  }
}