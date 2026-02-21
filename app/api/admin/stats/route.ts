import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import Source from '@/models/Source';
import User from '@/models/User';
import { startOfDay, subDays, format } from 'date-fns';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '7');

        await dbConnect();

        // 1. Global Stats
        const totalLeads = await Lead.countDocuments();
        const wonLeads = await Lead.countDocuments({ status: 'Won' });

        const conversionRate = totalLeads > 0
            ? (wonLeads / totalLeads) * 100
            : 0;

        const revenuePipeline = await Lead.aggregate([
            { $match: { status: 'Won' } },
            { $group: { _id: null, total: { $sum: '$value' } } }
        ]);

        // 2. Lead Volume (Dynamic range)
        const rangeStartDate = startOfDay(subDays(new Date(), days));
        const dailyVolume = await Lead.aggregate([
            { $match: { createdAt: { $gte: rangeStartDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const chartData = Array.from({ length: days }).map((_, i) => {
            const date = format(subDays(new Date(), (days - 1) - i), 'yyyy-MM-dd');
            const dayData = dailyVolume.find(d => d._id === date);
            return {
                date: format(subDays(new Date(), (days - 1) - i), days > 10 ? 'MMM dd' : 'MMM dd'),
                leads: dayData ? dayData.count : 0
            };
        });

        // 3. Source Breakdown
        const sourceStats = await Lead.aggregate([
            {
                $lookup: {
                    from: 'sources',
                    localField: 'source',
                    foreignField: '_id',
                    as: 'sourceInfo'
                }
            },
            { $unwind: '$sourceInfo' },
            {
                $group: {
                    _id: '$sourceInfo.name',
                    value: { $sum: 1 }
                }
            }
        ]);

        // 4. Team Performance
        const teamPerformance = await Lead.aggregate([
            { $match: { assignedTo: { $exists: true } } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'assignedTo',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            { $unwind: '$userInfo' },
            {
                $group: {
                    _id: '$userInfo._id',
                    name: { $first: '$userInfo.name' },
                    activeLeads: {
                        $sum: { $cond: [{ $in: ['$status', ['New', 'Contacted', 'Qualified']] }, 1, 0] }
                    },
                    wonLeads: {
                        $sum: { $cond: [{ $eq: ['$status', 'Won'] }, 1, 0] }
                    },
                    total: { $sum: 1 }
                }
            },
            {
                $project: {
                    name: 1,
                    activeLeads: 1,
                    closureRate: {
                        $cond: [
                            { $gt: ['$total', 0] },
                            { $multiply: [{ $divide: ['$wonLeads', '$total'] }, 100] },
                            0
                        ]
                    }
                }
            },
            { $sort: { closureRate: -1 } }
        ]);

        return NextResponse.json({
            stats: {
                totalLeads,
                conversionRate: conversionRate.toFixed(1),
                revenuePipeline: revenuePipeline[0]?.total || 0
            },
            chartData,
            sourceStats,
            teamPerformance
        });

    } catch (error: any) {
        console.error('Stats aggregation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
