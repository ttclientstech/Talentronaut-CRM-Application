import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Campaign from '@/models/Campaign';

export async function GET(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const domainId = searchParams.get('domainId');

        const query = domainId ? { domain: domainId } : {};
        const campaigns = await Campaign.find(query).sort({ createdAt: -1 });

        return NextResponse.json({ campaigns });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();
        const { name, domainId } = body;

        if (!name || !domainId) {
            return NextResponse.json({ error: 'Name and Domain ID are required' }, { status: 400 });
        }

        const campaign = await Campaign.create({ name, domain: domainId });
        return NextResponse.json({ campaign }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
