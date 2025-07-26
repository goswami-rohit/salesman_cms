// src/lib/company-service.ts
import prisma from '@/lib/prisma';

export interface CompanyInfo {
  companyName: string;
  companyId: number;
  adminName: string;
  adminEmail: string;
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
}

export async function getCompanyInfo(workosUserId: string): Promise<CompanyInfo | null> {
  try {
    // Get user with company information
    const user = await prisma.user.findUnique({
      where: { workosUserId },
      include: { 
        company: true
      }
    });

    if (!user || !user.company) {
      return null;
    }

    // Get user statistics for the company
    const totalUsers = await prisma.user.count({
      where: { companyId: user.companyId }
    });

    const activeUsers = await prisma.user.count({
      where: { 
        companyId: user.companyId,
        status: 'active'
      }
    });

    const pendingUsers = await prisma.user.count({
      where: { 
        companyId: user.companyId,
        status: 'pending'
      }
    });

    return {
      companyName: user.company.companyName,
      companyId: user.company.id,
      adminName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      adminEmail: user.email,
      totalUsers,
      activeUsers,
      pendingUsers,
    };
  } catch (error) {
    console.error('Error in getCompanyInfo:', error);
    return null;
  }
}