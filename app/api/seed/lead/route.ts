import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Source from '@/models/Source';
import Lead from '@/models/Lead';
import User from '@/models/User';

export async function GET() {
    try {
        await dbConnect();
        const sources = await Source.find({});
        const users = await User.find({}, 'name email');
        return NextResponse.json({
            sources: sources.map(s => ({ _id: s._id, name: s.name })),
            users: users.map(u => ({ _id: u._id, name: u.name, email: u.email })),
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST() {
    try {
        await dbConnect();

        // Find first available source
        const source = await Source.findOne({});
        if (!source) {
            return NextResponse.json({
                error: 'No source found in DB. Please create at least one Domain > Campaign > Source first from the Configuration page.'
            }, { status: 404 });
        }

        // Find Tanmay by name (case-insensitive), fallback to first user
        const tanmay = await User.findOne({ name: { $regex: /tanmay/i } });
        const assignee = tanmay || await User.findOne({});
        const assigneeName = assignee?.name ?? 'Admin';
        const assigneeId = assignee?._id;

        // Date helpers — IST offset accounted by using UTC hours
        const today = new Date();
        const daysAgo = (n: number, hour: number = 10) => {
            const d = new Date(today);
            d.setDate(d.getDate() - n);
            d.setHours(hour, 0, 0, 0);
            return d;
        };

        // Delete previously seeded dummy data (identified by seeded flag email pattern)
        await Lead.deleteMany({
            email: {
                $in: [
                    'aisha.khan@nexaworks.io',
                    'dev.patel@cloudify.co',
                    'sneha.joshi@hrbridge.in',
                    'rahul.verma@scalex.io',
                    'pooja.nair@fintechwave.com',
                    'arjun.mehta@brandlift.co',
                    'kavya.reddy@automate.ai',
                    'vivek.singh@launchpad.co',
                    'meera.kapoor@designhive.io',
                    'siddharth.roy@venturepeak.com',
                    // old dummy emails
                    'rohan.mehta@techventures.in',
                    'priya@startupbay.com',
                ]
            }
        });

        // 10 leads: 4 today · 3 yesterday · 3 two days ago
        const leadsData = [
            // ── TODAY (4 leads) ──────────────────────────────────────────
            {
                firstName: 'Aisha',
                lastName: 'Khan',
                email: 'aisha.khan@nexaworks.io',
                phone: '+91 98001 11234',
                company: 'NexaWorks',
                sourceUrl: 'https://nexaworks.io/hire',
                source: source._id,
                assignedTo: assigneeId,
                status: 'New',
                value: 180000,
                createdAt: daysAgo(0, 9),
                updatedAt: daysAgo(0, 9),
                remarks: [
                    {
                        note: 'Lead came via LinkedIn ad. Needs 2 React developers within 3 weeks.',
                        method: 'Email',
                        lastContactedDate: daysAgo(0, 9),
                        addedByName: assigneeName,
                    }
                ],
            },
            {
                firstName: 'Dev',
                lastName: 'Patel',
                email: 'dev.patel@cloudify.co',
                phone: '+91 91122 33445',
                company: 'Cloudify',
                sourceUrl: 'https://cloudify.co/contact',
                source: source._id,
                assignedTo: assigneeId,
                status: 'Contacted',
                value: 320000,
                createdAt: daysAgo(0, 11),
                updatedAt: daysAgo(0, 11),
                remarks: [
                    {
                        note: 'Spoken on call. Requires DevOps specialists for a 6-month contract. Budget confirmed at ₹3.2L.',
                        method: 'Call',
                        lastContactedDate: daysAgo(0, 11),
                        addedByName: assigneeName,
                    }
                ],
                meetings: [
                    {
                        title: 'Technical Requirements Call',
                        date: daysAgo(-1, 15),  // tomorrow
                        link: 'https://meet.google.com/dev-cloudify',
                        status: 'Scheduled',
                    }
                ]
            },
            {
                firstName: 'Sneha',
                lastName: 'Joshi',
                email: 'sneha.joshi@hrbridge.in',
                phone: '+91 90099 88776',
                company: 'HR Bridge',
                sourceUrl: 'https://hrbridge.in/staffing',
                source: source._id,
                assignedTo: assigneeId,
                status: 'Qualified',
                value: 500000,
                createdAt: daysAgo(0, 13),
                updatedAt: daysAgo(0, 13),
                remarks: [
                    {
                        note: 'Very promising lead. CHRO at HR Bridge wants to hire 5 senior engineers through us. Proposal stage.',
                        method: 'In-Person',
                        lastContactedDate: daysAgo(0, 13),
                        addedByName: assigneeName,
                    }
                ],
            },
            {
                firstName: 'Rahul',
                lastName: 'Verma',
                email: 'rahul.verma@scalex.io',
                phone: '+91 81234 56780',
                company: 'ScaleX',
                sourceUrl: 'https://scalex.io/talent',
                source: source._id,
                assignedTo: assigneeId,
                status: 'In Progress',
                value: 150000,
                createdAt: daysAgo(0, 16),
                updatedAt: daysAgo(0, 16),
                remarks: [
                    {
                        note: 'Startup founder. Looking for a product manager + UI designer combo. Budget is tight at ₹1.5L.',
                        method: 'WhatsApp',
                        lastContactedDate: daysAgo(0, 16),
                        addedByName: assigneeName,
                    }
                ],
            },

            // ── YESTERDAY (3 leads) ──────────────────────────────────────
            {
                firstName: 'Pooja',
                lastName: 'Nair',
                email: 'pooja.nair@fintechwave.com',
                phone: '+91 99887 76655',
                company: 'FintechWave',
                sourceUrl: 'https://fintechwave.com/careers',
                source: source._id,
                assignedTo: assigneeId,
                status: 'New',
                value: 400000,
                createdAt: daysAgo(1, 10),
                updatedAt: daysAgo(1, 10),
            },
            {
                firstName: 'Arjun',
                lastName: 'Mehta',
                email: 'arjun.mehta@brandlift.co',
                phone: '+91 78900 12345',
                company: 'BrandLift',
                sourceUrl: 'https://brandlift.co',
                source: source._id,
                assignedTo: assigneeId,
                status: 'Contacted',
                value: 220000,
                createdAt: daysAgo(1, 12),
                updatedAt: daysAgo(1, 14),
                remarks: [
                    {
                        note: 'Marketing agency needs performance marketers. Had a 30-min intro call. Keen on moving forward.',
                        method: 'Call',
                        lastContactedDate: daysAgo(1, 14),
                        addedByName: assigneeName,
                    }
                ],
            },
            {
                firstName: 'Kavya',
                lastName: 'Reddy',
                email: 'kavya.reddy@automate.ai',
                phone: '+91 88123 99001',
                company: 'Automate.ai',
                sourceUrl: 'https://automate.ai/team',
                source: source._id,
                assignedTo: assigneeId,
                status: 'Won',
                value: 750000,
                createdAt: daysAgo(1, 15),
                updatedAt: daysAgo(1, 17),
                remarks: [
                    {
                        note: 'Closed! Kavya confirmed 3 ML engineers placement. Contract signed. ₹7.5L deal. Excellent outcome.',
                        method: 'In-Person',
                        lastContactedDate: daysAgo(1, 17),
                        addedByName: assigneeName,
                    }
                ],
            },

            // ── TWO DAYS AGO (3 leads) ───────────────────────────────────
            {
                firstName: 'Vivek',
                lastName: 'Singh',
                email: 'vivek.singh@launchpad.co',
                phone: '+91 95551 22334',
                company: 'LaunchPad',
                sourceUrl: 'https://launchpad.co/hiring',
                source: source._id,
                assignedTo: assigneeId,
                status: 'Contacted',
                value: 280000,
                createdAt: daysAgo(2, 9),
                updatedAt: daysAgo(2, 11),
                remarks: [
                    {
                        note: 'Email intro sent. Startup accelerator scouting for backend engineers across 5 portfolio companies.',
                        method: 'Email',
                        lastContactedDate: daysAgo(2, 11),
                        addedByName: assigneeName,
                    }
                ],
            },
            {
                firstName: 'Meera',
                lastName: 'Kapoor',
                email: 'meera.kapoor@designhive.io',
                phone: '+91 82233 44556',
                company: 'DesignHive',
                sourceUrl: 'https://designhive.io',
                source: source._id,
                assignedTo: assigneeId,
                status: 'Lost',
                value: 120000,
                createdAt: daysAgo(2, 13),
                updatedAt: daysAgo(2, 16),
                remarks: [
                    {
                        note: 'Lead went cold. Decided to hire in-house. Marked as lost after 3 follow-up attempts.',
                        method: 'Email',
                        lastContactedDate: daysAgo(2, 16),
                        addedByName: assigneeName,
                    }
                ],
            },
            {
                firstName: 'Siddharth',
                lastName: 'Roy',
                email: 'siddharth.roy@venturepeak.com',
                phone: '+91 91100 88776',
                company: 'VenturePeak',
                sourceUrl: 'https://venturepeak.com/contact',
                source: source._id,
                assignedTo: assigneeId,
                status: 'In Progress',
                value: 600000,
                createdAt: daysAgo(2, 10),
                updatedAt: daysAgo(2, 14),
                remarks: [
                    {
                        note: 'VC-backed company. Hiring aggressively — needs 8 engineers in Q1. Proposal being prepared.',
                        method: 'Call',
                        lastContactedDate: daysAgo(2, 14),
                        addedByName: assigneeName,
                    }
                ],
                meetings: [
                    {
                        title: 'Proposal Presentation',
                        date: daysAgo(0, 14),  // today afternoon
                        link: 'https://meet.google.com/vpeak-proposal',
                        status: 'Scheduled',
                    }
                ]
            },
        ];

        const leads = await Lead.insertMany(leadsData);

        return NextResponse.json({
            success: true,
            assignedTo: assigneeName,
            message: `Seeded ${leads.length} leads across 3 days → assigned to ${assigneeName}`,
            breakdown: {
                today: leadsData.filter(l => {
                    const d = l.createdAt as Date;
                    return d >= daysAgo(0, 0);
                }).length,
                yesterday: leadsData.filter(l => {
                    const d = l.createdAt as Date;
                    return d >= daysAgo(1, 0) && d < daysAgo(0, 0);
                }).length,
                twoDaysAgo: leadsData.filter(l => {
                    const d = l.createdAt as Date;
                    return d >= daysAgo(2, 0) && d < daysAgo(1, 0);
                }).length,
            },
            leadIds: leads.map(l => l._id),
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack?.split('\n').slice(0, 5) }, { status: 500 });
    }
}
