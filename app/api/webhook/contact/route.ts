import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import Source from '@/models/Source';
import Campaign from '@/models/Campaign';
import Domain from '@/models/Domain';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { sendEmailNotification } from '@/lib/emailService';

// ─── CORS headers for cross-origin requests from the public website ───
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',          // tighten to your website domain in production
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Pre-flight (OPTIONS) – browsers send this before POST from a different origin
export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}



// ─── Main POST handler ───────────────────────────────────────────────────────
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { fullName, email, phone, subject, message } = body;

        // Basic validation
        if (!fullName || !email) {
            return NextResponse.json(
                { success: false, error: 'fullName and email are required.' },
                { status: 400, headers: CORS_HEADERS }
            );
        }

        // Split full name into first / last
        const nameParts = String(fullName).trim().split(/\s+/);
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || '-';

        await dbConnect();

        // 1. Create the lead directly using the new schema
        const newLeadData: any = {
            firstName,
            lastName,
            email: String(email).toLowerCase().trim(),
            phone: phone || undefined,
            sourceType: 'Website',
            sourceUrl: 'Talentronaut Website',
            status: 'New',
            value: 0,
        };

        if (subject || message) {
            newLeadData.remarks = [{
                note: `Contact Form Submission:\nSubject: ${subject || 'No Subject'}\nMessage: ${message || 'No Message'}`,
                method: 'Other',
                addedByName: 'Website Form',
            }];
        }

        const lead = await Lead.create(newLeadData);

        console.log(`✅ Webhook lead created: ${lead._id}`);

        // 4. Send Notifications (In-App & Email)
        try {
            // Find admins and sales team members to notify
            // For now, notify all Admins
            const admins = await User.find({ role: { $in: ['Admin', 'Administrator'] }, status: { $ne: 'Inactive' } });

            if (admins.length > 0) {
                const notificationsToInsert = admins.map(admin => ({
                    userId: admin._id,
                    title: `New Lead: ${firstName} ${lastName}`,
                    message: `A new lead just registered from the website.`,
                    type: 'Lead',
                    link: `/admin/leads/${lead._id}`,
                }));

                await Notification.insertMany(notificationsToInsert);

                const adminEmails = admins.map(a => a.email);
                const emailHtml = `
                    <h2>New Lead Received!</h2>
                    <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <br/>
                    <a href="${process.env.NEXTAUTH_URL}/admin/leads/${lead._id}">Click here to view lead in CRM</a>
                `;

                if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
                    await sendEmailNotification(
                        adminEmails,
                        `New Lead Alert: ${firstName} ${lastName}`,
                        emailHtml
                    );
                }
            }
        } catch (notifErr) {
            console.error('Error sending lead notifications:', notifErr);
        }

        return NextResponse.json(
            {
                success: true,
                leadId: lead._id,
            },
            { status: 201, headers: CORS_HEADERS }
        );

    } catch (error: any) {
        console.error('❌ Webhook error:', error.message);
        return NextResponse.json(
            { success: false, error: 'Internal server error. Please try again.' },
            { status: 500, headers: CORS_HEADERS }
        );
    }
}
