// src/app/api/debug-roles/route.ts
import { NextResponse } from 'next/server';
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY as string);

// export async function GET() {
//   try {
//     // Get all organizations
//     const organizations = await workos.organizations.listOrganizations();
    
//     const organizationsWithRoles = [];
    
//     // For each organization, get its available roles using the correct SDK method
//     for (const org of organizations.data) {
//       try {
//         console.log(`Fetching roles for organization: ${org.name} (${org.id})`);
        
//         const roles = await workos.organizations.listOrganizationRoles({
//           organizationId: org.id
//         });
        
//         console.log(`Found ${roles.data.length} roles for ${org.name}`);
        
//         organizationsWithRoles.push({
//           id: org.id,
//           name: org.name,
//           roles: roles.data.map(role => ({
//             id: role.id,
//             name: role.name,
//             slug: role.slug,
//             description: role.description,
//             type: role.type, // 'EnvironmentRole' or 'OrganizationRole'
//             permissions: role.permissions,
//             permissionsCount: role.permissions.length,
//             createdAt: role.createdAt,
//             updatedAt: role.updatedAt
//           })),
//           rolesCount: roles.data.length
//         });
        
//       } catch (roleError: any) {
//         console.error(`Error fetching roles for org ${org.id}:`, roleError);
//         organizationsWithRoles.push({
//           id: org.id,
//           name: org.name,
//           roles: [],
//           error: roleError.message || 'Failed to fetch roles'
//         });
//       }
//     }
    
//     return NextResponse.json({ 
//       organizationsWithRoles,
//       totalOrganizations: organizations.data.length,
//       message: 'Organizations with their available roles (using correct SDK method)',
//       sdkMethod: 'workos.organizations.listOrganizationRoles()'
//     });
    
//   } catch (error: any) {
//     console.error('Debug roles error:', error);
//     return NextResponse.json({ 
//       error: error.message,
//       code: error.code,
//       status: error.status
//     }, { status: 500 });
//   }
// }

export async function GET() {
  return NextResponse.json({
    WORKOS_CLIENT_ID: process.env.WORKOS_CLIENT_ID ? 'Set' : 'Missing',
    WORKOS_API_KEY: process.env.WORKOS_API_KEY ? 'Set' : 'Missing',
    WORKOS_REDIRECT_URI: process.env.WORKOS_REDIRECT_URI,
    AUTHKIT_REDIRECT_URI: process.env.AUTHKIT_REDIRECT_URI,
    NODE_ENV: process.env.NODE_ENV,
  });
}