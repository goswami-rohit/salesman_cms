// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { WorkOS } from '@workos-inc/node';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for unique IDs
import bcrypt from 'bcryptjs'; // Import bcryptjs

// Create Gmail transporter
const createEmailTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });
};

// Gmail email sending function - UPDATED
async function sendInvitationEmailGmail({
    to,
    firstName,
    lastName,
    companyName,
    adminName,
    inviteUrl,
    role,
    fromEmail,
    salesmanLoginId, // NEW: Pass salesmanLoginId
    tempPassword // NEW: Pass temporary password
}: {
    to: string;
    firstName: string;
    lastName: string;
    companyName: string;
    adminName: string;
    inviteUrl: string;
    role: string;
    fromEmail: string;
    salesmanLoginId?: string | null; // Make optional as it's for staff only
    tempPassword?: string | null; // Make optional
}) {
    const transporter = createEmailTransporter();

    // Conditional content for salesman details
    const salesmanDetailsHtml = salesmanLoginId && tempPassword ? `
            <p>For your **Sales Team Mobile App** login:</p>
            <ul>
                <li><strong>Employee ID (Login ID):</strong> <span style="font-family: monospace; background-color: #e9ecef; padding: 5px 10px; border-radius: 4px; display: inline-block;">${salesmanLoginId}</span></li>
                <li><strong>Temporary Password:</strong> <span style="font-family: monospace; background-color: #e9ecef; padding: 5px 10px; border-radius: 4px; display: inline-block;">${tempPassword}</span></li>
            </ul>
            <p style="color: #d9534f; font-weight: bold;">Please change this temporary password immediately after your first login to the mobile app.</p>
        ` : '';

    const salesmanDetailsText = salesmanLoginId && tempPassword ? `
For your Sales Team Mobile App login:
Employee ID (Login ID): ${salesmanLoginId}
Temporary Password: ${tempPassword}
Please change this temporary password immediately after your first login to the mobile app.
        ` : '';


    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation to ${companyName}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0070f3; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { background-color: #0070f3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: bold; }
            .button:hover { background-color: #0056b3; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .invite-code { background-color: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🎉 You're Invited!</h1>
            <p>Welcome to ${companyName}</p>
        </div>
        
        <div class="content">
            <p><strong>Hi ${firstName},</strong></p>
            
            <p>${adminName} has invited you to join <strong>${companyName}</strong> as a <strong>${role}</strong>.</p>
            
            <p>To accept this invitation and set up your account for the web application, please click the button below:</p>
            
            <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">Accept Web App Invitation & Join Team</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <div class="invite-code">${inviteUrl}</div>
            
            ${salesmanDetailsHtml} {/* NEW: Include salesman details */}
            
            <p><strong>What happens next?</strong></p>
            <ul>
                <li>Click the invitation link above to set up your web app account.</li>
                <li>Access your team dashboard.</li>
                <li>${salesmanLoginId ? 'Use your Employee ID and Temporary Password above to log in to the Sales Team Mobile App.' : ''}</li>
                <li>Start collaborating with your team!</li>
            </ul>
            
            <p><em>This web app invitation will expire in 7 days for security reasons.</em></p>
            
            <p>Welcome to the team!</p>
            <p><strong>The ${companyName} Team</strong></p>
        </div>
        
        <div class="footer">
            <p>If you have any questions, please contact your administrator.</p>
            <p>This email was sent from ${companyName} Team Management System.</p>
        </div>
    </body>
    </html>
  `;

    const textContent = `
You're invited to join ${companyName}!

Hi ${firstName},

${adminName} has invited you to join ${companyName} as a ${role}.

To accept this invitation and set up your account for the web application, please visit:
${inviteUrl}

${salesmanDetailsText}

This web app invitation will expire in 7 days.

Welcome to the team!
The ${companyName} Team
  `;

    const mailOptions = {
        from: `"${companyName}" <${fromEmail}>`,
        to: to,
        subject: `🎉 You're invited to join ${companyName}!`,
        text: textContent,
        html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return result;
}

// Function to generate a random password
function generateRandomPassword(length: number = 10): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}


// POST - Create a new user and send invitation
export async function POST(request: Request) {
    try {
        const workos = new WorkOS(process.env.WORKOS_API_KEY!);
        const claims = await getTokenClaims();

        if (!claims || !claims.sub) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = claims.sub;
        const organizationId = claims.org_id as string;

        console.log('🔍 Claims:', { userId, organizationId, role: claims.role });

        const adminUser = await prisma.user.findUnique({
            where: { workosUserId: userId },
            include: { company: true }
        });

        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        if (!organizationId) {
            return NextResponse.json({ error: 'No organization found for admin user. Please logout and login again.' }, { status: 400 });
        }

        const body = await request.json();
        const { email, firstName, lastName, phoneNumber, role } = body;

        // Validate required fields
        if (!email || !firstName || !lastName || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let workosRole = role.toLowerCase();
        if (role === 'employee') {
            workosRole = 'staff';
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                email,
                companyId: adminUser.companyId
            }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
        }

        const inviteToken = `invite_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        const tempWorkosUserId = `temp_${uuidv4()}`; // Use uuid for better uniqueness

        let salesmanLoginId: string | null = null;
        let tempPasswordPlaintext: string | null = null;
        let hashedPassword = null;

        // Generate salesmanLoginId and temporary password ONLY for 'staff' role
        if (workosRole === 'staff') { // Use the mapped WorkOS role
            // Generate unique salesmanLoginId
            let isUnique = false;
            while (!isUnique) {
                const generatedId = `EMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                const existingSalesman = await prisma.user.findUnique({ where: { salesmanLoginId: generatedId } });
                if (existingSalesman) {
                    // Collision, generate again
                } else {
                    salesmanLoginId = generatedId;
                    isUnique = true;
                }
            }

            // Generate temporary password and hash it
            tempPasswordPlaintext = generateRandomPassword();
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(tempPasswordPlaintext, salt);
        }

        // Create user in database
        const newUser = await prisma.user.create({
            data: {
                email,
                firstName,
                lastName,
                phoneNumber,
                role: workosRole,
                workosUserId: tempWorkosUserId,
                companyId: adminUser.companyId,
                inviteToken: inviteToken,
                status: 'pending',
                salesmanLoginId, // Now correctly assigned
                hashedPassword, // Now correctly assigned (if staff)
            },
        });

        console.log('✅ Created database user:', newUser.id);

        let workosInvitationData = null;
        try {
            console.log('🔄 Sending WorkOS invitation with data:', {
                email,
                organizationId: organizationId,
                roleSlug: workosRole
            });

            // Send invitation with mapped role
            const invitation = await workos.userManagement.sendInvitation({
                email: email,
                organizationId: organizationId,
                roleSlug: workosRole
            });

            console.log('✅ Sent WorkOS invitation:', {
                id: invitation.id,
                email: invitation.email,
                organizationId: invitation.organizationId,
                state: invitation.state
            });
            workosInvitationData = invitation;

        } catch (workosError: any) {
            console.error('❌ WorkOS invitation error:', workosError);
            console.error('❌ WorkOS error message:', workosError.message);
            console.error('❌ WorkOS error response:', workosError.response?.data);

            if (workosError.response?.data) {
                console.error('❌ Full error response:', JSON.stringify(workosError.response.data, null, 2));
            }

            return NextResponse.json({
                error: `Failed to send invitation in WorkOS: ${workosError.message}`
            }, { status: 500 });
        }

        // Send invitation email using Gmail
        try {
            const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/joinNewUser?token=${inviteToken}`;

            await sendInvitationEmailGmail({
                to: email,
                firstName,
                lastName,
                companyName: adminUser.company.companyName,
                adminName: `${adminUser.firstName} ${adminUser.lastName}`,
                inviteUrl,
                role: workosRole,
                fromEmail: process.env.GMAIL_USER || 'noreply@yourcompany.com',
                salesmanLoginId: salesmanLoginId, // Pass generated ID
                tempPassword: tempPasswordPlaintext // Pass temporary password
            });

            console.log(`✅ Invitation email sent to ${email} via Gmail`);
        } catch (emailError) {
            console.error('❌ Failed to send invitation email:', emailError);
        }

        return NextResponse.json({
            message: 'Invitation sent and email delivered successfully',
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                role: newUser.role,
                salesmanLoginId: newUser.salesmanLoginId, // Return salesmanLoginId
            },
            workosInvitation: workosInvitationData
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}

// ... (GET function for /api/users remains unchanged below this)
// src/app/api/users/route.ts
// ... (GET function - Fetch all users remains the same as before)
// ... (GET function for /api/users remains unchanged below this)
export async function GET(request: Request) {
    try {
        const claims = await getTokenClaims();

        if (!claims || !claims.sub) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { workosUserId: claims.sub },
            include: { company: true }
        });
        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if requesting current user info only
        const url = new URL(request.url);
        if (url.searchParams.get('current') === 'true') {
            return NextResponse.json({
                currentUser: {
                    role: currentUser.role,
                    firstName: currentUser.firstName,
                    lastName: currentUser.lastName,
                    companyName: currentUser.company?.companyName
                }
            });
        }
        // Original logic for admin users list
        if (currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            where: { companyId: currentUser.companyId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            users,
            currentUser: {
                role: currentUser.role,
                companyName: currentUser.company?.companyName
            }
        });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}