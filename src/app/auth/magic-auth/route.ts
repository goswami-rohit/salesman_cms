// src/app/api/auth/magic-auth/route.ts
import { WorkOS } from '@workos-inc/node';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

// --- START: EMAIL UTILITY DEPENDENCIES (COMPLETE DEFINITION INCLUDED) ---
const EMAIL_TIMEOUT_MS = 12000;

const transportOptions: SMTPTransport.Options = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: process.env.GMAIL_USER!, pass: process.env.GMAIL_APP_PASSWORD! },
    connectionTimeout: 10000,
    greetingTimeout: 7000,
    socketTimeout: 15000,
    // @ts-ignore
    family: 4,
};

const transporter = nodemailer.createTransport(transportOptions);

async function withTimeout<T>(p: Promise<T>, ms = EMAIL_TIMEOUT_MS): Promise<T> {
    return await Promise.race([
        p,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('EMAIL_TIMEOUT')), ms)),
    ]);
}

/**
 * Sends a custom email with the 6-digit Magic Auth code.
 */
async function sendMagicAuthCodeEmailGmail({
    to,
    code,
    companyName = 'Team Dashboard',
}: {
    to: string;
    code: string;
    companyName?: string;
}) {
    const mailbox = process.env.GMAIL_USER!;

    // --- FULL HTML CONTENT (Crucial Fix) ---
    const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your One-Time Login Code</title>
      <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .code-box { background-color: #e5e7eb; color: #1f2937; font-size: 28px; font-weight: bold; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0; letter-spacing: 5px; font-family: monospace; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
  </head>
  <body>
      <div class="header">
          <h2>One-Time Login Code</h2>
      </div>

      <div class="content">
          <p>Hi there,</p>
          <p>Use the 6-digit code below to sign in to the <strong>${companyName}</strong> dashboard:</p>

          <div class="code-box">${code}</div>

          <p>This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
          
          <p>Thanks,</p>
          <p>The <strong>${companyName}</strong> Team</p>
      </div>

      <div class="footer">
          <p>This email was sent from <strong>${companyName}</strong> Team Management System.</p>
      </div>
  </body>
  </html>
  `;
    // --- FULL TEXT CONTENT ---
    const textContent = `
Your One-Time Login Code for ${companyName}:

Use the 6-digit code below to sign in:
${code}

This code will expire in 10 minutes. If you did not request this code, please ignore this email.
  `;

    const mailOptions: nodemailer.SendMailOptions = {
        from: `"Auth Service (${companyName})" <${mailbox}>`,
        to,
        subject: `Your One-Time Login Code for ${companyName}`,
        text: textContent,
        html: htmlContent,
        envelope: { from: mailbox, to },
    };

    await withTimeout(transporter.verify(), 6000);
    const info = await withTimeout(transporter.sendMail(mailOptions), EMAIL_TIMEOUT_MS);

    return info;
}
// --- END: EMAIL UTILITY DEPENDENCIES ---


// Initialize the WorkOS client.
if (!process.env.WORKOS_API_KEY) {
    throw new Error('WORKOS_API_KEY is not set in environment variables');
}
const workos = new WorkOS(process.env.WORKOS_API_KEY);

/**
 * Handles the POST request for Magic Auth Code Creation (Email Submission).
 * This is the route: /api/auth/magic-auth
 */
export const POST = async (request: NextRequest) => {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
        }
        
        // --- CODE CREATION STAGE ---

        // Call WorkOS to create the Magic Auth code.
        const magicAuth = await workos.userManagement.createMagicAuth({
            email: email,
        });

        console.log(`✅ WorkOS created Magic Auth ID: ${magicAuth.id}`);

        // Get the Company Name for better email branding
        const user = await prisma.user.findFirst({
            where: { email: email },
            select: { company: { select: { companyName: true } } }
        });
        // Use the actual company name in the sender
        const companyName = user?.company?.companyName || 'Team Dashboard'; 

        // Send email using your custom Nodemailer function
        if (magicAuth.code) {
            await sendMagicAuthCodeEmailGmail({
                to: email,
                code: magicAuth.code,
                companyName: companyName,
            });
            console.log(`✅ Custom Magic Auth email sent to ${email} via Gmail. Code: ${magicAuth.code}`);
        } else {
            console.error('WorkOS did not return a code for custom email delivery.');
            throw new Error('Could not retrieve login code from authentication service.');
        }

        // Return a successful response. 
        return NextResponse.json({
            success: true,
            message: 'A one-time login code has been sent to your email via custom mail service. Please check your inbox.',
            email: magicAuth.email,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Magic Auth Create Handler Failed:', error);
        return NextResponse.json({
            error: 'An unexpected server error occurred while requesting the code.'
        }, { status: 500 });
    }
};

// Disable all other HTTP methods
export const GET = () => NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
export const PATCH = () => NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
export const PUT = () => NextResponse.json({ error: 'Method not allowed' }, { status: 405 });