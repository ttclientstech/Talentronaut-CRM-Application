import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import '@/models/Source'; // register for Lead.populate('source')
import '@/models/User';   // register for Lead.populate('assignedTo')


export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const userId = (session.user as any).id;

        const leads = await Lead.find({ assignedTo: userId })
            .populate('source', 'name')
            .populate('assignedTo', 'name email')
            .sort({ updatedAt: -1 });

        return NextResponse.json({ leads });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
