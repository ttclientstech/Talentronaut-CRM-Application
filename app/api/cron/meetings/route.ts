import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { sendEmailNotification } from '@/lib/emailService';

export async function GET(req: Request) {
    // Basic security check to ensure this is triggered intentionally
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();

        const now = new Date();
        // Look for meetings between now and 20 minutes from now
        const twentyMinsFromNow = new Date(now.getTime() + 20 * 60000);

        // Fetch leads that have scheduled meetings in our time window
        const leadsWithMeetings = await Lead.find({
            'meetings.status': 'Scheduled',
            'meetings.date': {
                $gte: now,
                $lte: twentyMinsFromNow,
            }
        });

        const notificationsCreated: any[] = [];

        for (const lead of leadsWithMeetings) {
            const upcomingMeetings = lead.meetings.filter(
                (m: any) => m.status === 'Scheduled' && m.date >= now && m.date <= twentyMinsFromNow
            );

            for (const meeting of upcomingMeetings) {
                // Determine who to notify
                let usersToNotify = [];
                if (lead.assignedTo) {
                    const assignedUser = await User.findById(lead.assignedTo);
                    if (assignedUser) usersToNotify.push(assignedUser);
                } else {
                    // Fallback to Admins if no one is assigned
                    const admins = await User.find({ role: { $in: ['Admin', 'Administrator'] }, status: { $ne: 'Inactive' } });
                    usersToNotify.push(...admins);
                }

                if (usersToNotify.length > 0) {
                    // Avoid duplicate notifications for the same meeting
                    // Create a unique link/identifier to check
                    const meetingLinkPath = `/admin/leads/${lead._id}?meetingId=${meeting._id}`;

                    for (const user of usersToNotify) {
                        const existingNotif = await Notification.findOne({
                            userId: user._id,
                            type: 'Meeting',
                            title: { $regex: meeting.title, $options: 'i' },
                            createdAt: { $gte: new Date(now.getTime() - 60 * 60000) } // within last hour
                        });

                        if (!existingNotif) {
                            await Notification.create({
                                userId: user._id,
                                title: `Upcoming Meeting: ${meeting.title}`,
                                message: `You have a meeting with ${lead.firstName} ${lead.lastName} in 15 minutes.`,
                                type: 'Meeting',
                                link: `/admin/leads/${lead._id}`,
                            });

                            if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
                                const emailHtml = `
                                    <h2>Upcoming Meeting Reminder</h2>
                                    <p><strong>Lead:</strong> ${lead.firstName} ${lead.lastName}</p>
                                    <p><strong>Title:</strong> ${meeting.title}</p>
                                    <p><strong>Date/Time:</strong> ${new Date(meeting.date).toLocaleString('en-IN')}</p>
                                    ${meeting.link ? `<p><strong>Meeting Link:</strong> <a href="${meeting.link}">${meeting.link}</a></p>` : ''}
                                    <br/>
                                    <a href="${process.env.NEXTAUTH_URL}/admin/leads/${lead._id}">View details in CRM</a>
                                `;

                                await sendEmailNotification(
                                    [user.email],
                                    `Meeting Reminder: ${meeting.title}`,
                                    emailHtml
                                );
                            }

                            notificationsCreated.push({
                                user: user.email,
                                meeting: meeting.title
                            });
                        }
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            processedCount: leadsWithMeetings.length,
            notificationsCreated,
        });

    } catch (error: any) {
        console.error('❌ Meetings Cron error:', error.message);
        return NextResponse.json(
            { success: false, error: 'Internal server error.' },
            { status: 500 }
        );
    }
}
