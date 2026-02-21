import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const userId = (session.user as any).id;
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());

        // 1. Leads assigned today
        const assignedToday = await Lead.find({
            assignedTo: userId,
            createdAt: { $gte: todayStart, $lte: todayEnd }
        }).populate('source');

        // 2. Active follow-ups / Leads needing action
        const activeLeads = await Lead.find({
            assignedTo: userId,
            status: { $in: ['New', 'Contacted', 'Qualified'] }
        }).sort({ updatedAt: -1 }).limit(10).populate('source');

        // 3. Simple stats for Sales Member
        const stats = {
            totalAssigned: await Lead.countDocuments({ assignedTo: userId }),
            convertedLeads: await Lead.countDocuments({ assignedTo: userId, status: 'Closed' }),
            leadsToday: assignedToday.length
        };

        return NextResponse.json({
            assignedToday,
            activeLeads,
            stats,
            notifications: [
                { id: 1, type: 'info', message: 'Welcome to your new Sales Workspace!', time: 'Just now' },
                { id: 2, type: 'success', message: `You have ${assignedToday.length} new leads assigned today.`, time: 'Today' }
            ]
        });

    } catch (error: any) {
        console.error('Sales stats aggregation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
