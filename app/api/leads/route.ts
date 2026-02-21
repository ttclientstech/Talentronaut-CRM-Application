import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import '@/models/Source'; // register for Lead.populate
import '@/models/User';   // register for Lead.populate


export async function GET(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const sourceId = searchParams.get('sourceId');

        const query = sourceId ? { source: sourceId } : {};
        const leads = await Lead.find(query)
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 });

        return NextResponse.json({ leads });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();
        const lead = await Lead.create(body);
        return NextResponse.json({ lead }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
