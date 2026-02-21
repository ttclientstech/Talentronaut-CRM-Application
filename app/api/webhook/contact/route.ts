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

// ─── Subject → Domain + Campaign mapping ────────────────────────────────────
// Keywords are matched case-insensitively. Add / edit entries freely.
const DOMAIN_MAP: { keywords: string[]; domain: string; campaign: string }[] = [
    {
        keywords: ['ai', 'ml', 'machine learning', 'artificial intelligence', 'chatbot', 'automation', 'nlp'],
        domain: 'AI Solutions',
        campaign: 'AI Outreach',
    },
    {
        keywords: ['web', 'website', 'app', 'application', 'software', 'development', 'mobile', 'saas', 'platform'],
        domain: 'Web & App Development',
        campaign: 'Website Leads',
    },
    {
        keywords: ['talent', 'recruit', 'hr', 'hiring', 'staffing', 'workforce', 'team'],
        domain: 'Talent Sourcing',
        campaign: 'Recruitment Leads',
    },
    {
        keywords: ['consult', 'strategy', 'advisory', 'enterprise', 'solution', 'digital transformation'],
        domain: 'Consulting',
        campaign: 'Consulting Enquiries',
    },
];

const DEFAULT_DOMAIN = 'General Enquiries';
const DEFAULT_CAMPAIGN = 'Website Enquiries';
const SOURCE_NAME = 'Company Website';

function mapSubjectToHierarchy(subject: string): { domain: string; campaign: string } {
    const lower = subject.toLowerCase();
    for (const entry of DOMAIN_MAP) {
        if (entry.keywords.some(kw => lower.includes(kw))) {
            return { domain: entry.domain, campaign: entry.campaign };
        }
    }
    return { domain: DEFAULT_DOMAIN, campaign: DEFAULT_CAMPAIGN };
}

// ─── Upsert helpers (find or create) ────────────────────────────────────────
async function findOrCreateDomain(name: string) {
    return Domain.findOneAndUpdate(
        { name },
        { $setOnInsert: { name, status: 'Active' } },
        { upsert: true, new: true }
    );
}

async function findOrCreateCampaign(name: string, domainId: string) {
    return Campaign.findOneAndUpdate(
        { name, domain: domainId },
        { $setOnInsert: { name, domain: domainId, status: 'Active' } },
        { upsert: true, new: true }
    );
}

async function findOrCreateSource(campaignId: string) {
    return Source.findOneAndUpdate(
        { name: SOURCE_NAME, campaign: campaignId },
        { $setOnInsert: { name: SOURCE_NAME, campaign: campaignId, type: 'Website', status: 'Active' } },
        { upsert: true, new: true }
    );
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

        // 1. Map subject → domain / campaign names
        const { domain: domainName, campaign: campaignName } = mapSubjectToHierarchy(subject || '');

        // 2. Upsert the hierarchy
        const domainDoc = await findOrCreateDomain(domainName);
        const campaignDoc = await findOrCreateCampaign(campaignName, domainDoc._id.toString());
        const sourceDoc = await findOrCreateSource(campaignDoc._id.toString());

        // 3. Create the lead
        const lead = await Lead.create({
            firstName,
            lastName,
            email: String(email).toLowerCase().trim(),
            phone: phone || undefined,
            company: undefined,
            source: sourceDoc._id,
            status: 'New',
            value: 0,
            details: new Map(Object.entries({
                subject: subject || '',
                message: message || '',
                submittedFrom: 'Company Website',
                submittedAt: new Date().toISOString(),
            })),
        });

        console.log(`✅ Webhook lead created: ${lead._id} | ${domainName} → ${campaignName} → ${SOURCE_NAME}`);

        // 4. Send Notifications (In-App & Email)
        try {
            // Find admins and sales team members to notify
            // For now, notify all Admins
            const admins = await User.find({ role: { $in: ['Admin', 'Administrator'] }, status: { $ne: 'Inactive' } });

            if (admins.length > 0) {
                const notificationsToInsert = admins.map(admin => ({
                    userId: admin._id,
                    title: `New Lead: ${firstName} ${lastName}`,
                    message: `A new lead just registered from the website for ${domainName}.`,
                    type: 'Lead',
                    link: `/admin/leads/${lead._id}`,
                }));

                await Notification.insertMany(notificationsToInsert);

                const adminEmails = admins.map(a => a.email);
                const emailHtml = `
                    <h2>New Lead Received!</h2>
                    <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Domain:</strong> ${domainName}</p>
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
                hierarchy: {
                    domain: domainName,
                    campaign: campaignName,
                    source: SOURCE_NAME,
                },
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
