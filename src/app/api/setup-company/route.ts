// src/app/api/setup-company/route.ts
import { NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY as string);

export async function POST(request: Request) {
  try {
    const { user } = await withAuth({ ensureSignedIn: true });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: No authenticated user found.' }, { status: 401 });
    }

    console.log('✅ Authenticated user:', { id: user.id, email: user.email });

    const body = await request.json();
    const { companyName, officeAddress, isHeadOffice, phoneNumber } = body;

    if (!companyName || !officeAddress || typeof isHeadOffice !== 'boolean' || !phoneNumber) {
      return NextResponse.json({ error: 'Missing required company details in the request body.' }, { status: 400 });
    }

    const existingCompanyInDb = await prisma.company.findUnique({
      where: { adminUserId: user.id },
    });

    if (existingCompanyInDb) {
      return NextResponse.json({ error: 'Company already set up for this user in your database.' }, { status: 409 });
    }

    // Create WorkOS Organization
    let workosOrganization;
    try {
      workosOrganization = await workos.organizations.createOrganization({
        name: companyName,
        metadata: {
          adminUserId: user.id,
        },
      });
      console.log(`✅ WorkOS Organization created: '${workosOrganization.name}' with ID: ${workosOrganization.id}`);
    } catch (workosOrgError: any) {
      console.error('❌ Error creating WorkOS Organization:', workosOrgError);
      return NextResponse.json({ 
        error: 'Failed to create WorkOS Organization.', 
        details: workosOrgError.message 
      }, { status: 500 });
    }

    // Create Organization Membership without role initially
    try {
      console.log('👤 Creating organization membership without role...');
      
      const membership = await workos.userManagement.createOrganizationMembership({
        userId: user.id,
        organizationId: workosOrganization.id,
        roleSlug: 'admin',
      });
      
      console.log(`✅ WorkOS Organization Membership created:`, {
        id: membership.id,
        userId: membership.userId,
        organizationId: membership.organizationId,
        roleSlug: membership.role
      });
      
    } catch (membershipError: any) {
      console.error('❌ Error creating WorkOS Organization Membership:', {
        error: membershipError,
        message: membershipError.message,
        code: membershipError.code,
        status: membershipError.status
      });
      
      // Clean up the organization if membership fails
      try {
        await workos.organizations.deleteOrganization(workosOrganization.id);
        console.log(`✅ Cleaned up WorkOS Organization ${workosOrganization.id}`);
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup organization:', cleanupError);
      }
      
      return NextResponse.json({ 
        error: 'Failed to create WorkOS Organization Membership for admin.',
        details: membershipError.message,
        code: membershipError.code
      }, { status: 500 });
    }

    // Create database records
    const newCompany = await prisma.company.create({
      data: {
        companyName,
        officeAddress,
        isHeadOffice,
        phoneNumber,
        adminUserId: user.id,
        workosOrganizationId: workosOrganization.id,
      },
    });

    const newAdminUser = await prisma.user.create({
      data: {
        workosUserId: user.id,
        companyId: newCompany.id,
        email: user.email,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        role: 'admin', // This is your internal database role
      },
    });

    console.log('🎉 Company setup completed successfully!');
    return NextResponse.json({
      message: 'Company profile and WorkOS Organization created successfully!',
      company: newCompany,
      adminUser: newAdminUser,
      workosOrganizationId: workosOrganization.id,
    }, { status: 201 });

  } catch (error: any) {
    console.error('💥 Unexpected API Error during company setup:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error during company setup.',
    }, { status: 500 });
  }
}