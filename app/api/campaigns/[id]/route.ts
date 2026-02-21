import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Campaign from '@/models/Campaign';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const body = await req.json();
        const { id } = params;

        const campaign = await Campaign.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        });

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        return NextResponse.json({ campaign });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const { id } = params;

        const campaign = await Campaign.findByIdAndDelete(id);

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Campaign deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
