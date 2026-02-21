import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Source from '@/models/Source';

export async function GET(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const campaignId = searchParams.get('campaignId');

        const query = campaignId ? { campaign: campaignId } : {};
        const sources = await Source.find(query).sort({ createdAt: -1 });

        return NextResponse.json({ sources });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();
        const { name, campaignId, type } = body;

        if (!name || !campaignId) {
            return NextResponse.json({ error: 'Name and Campaign ID are required' }, { status: 400 });
        }

        const source = await Source.create({ name, campaign: campaignId, type });
        return NextResponse.json({ source }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
