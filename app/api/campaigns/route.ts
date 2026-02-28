import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Campaign from '@/models/Campaign';

export async function GET(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const subdomainId = searchParams.get('subdomainId');

        const query = subdomainId ? { subdomain: subdomainId } : {};
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
        const { name, subdomainId } = body;

        if (!name || !subdomainId) {
            return NextResponse.json({ error: 'Name and Subdomain ID are required' }, { status: 400 });
        }

        const campaign = await Campaign.create({ name, subdomain: subdomainId });
        return NextResponse.json({ campaign }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
