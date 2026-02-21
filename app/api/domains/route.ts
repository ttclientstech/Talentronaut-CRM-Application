import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Domain from '@/models/Domain';

export async function GET() {
    try {
        await dbConnect();
        const domains = await Domain.find({}).sort({ createdAt: -1 });
        return NextResponse.json({ domains });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const domain = await Domain.create({ name });
        return NextResponse.json({ domain }, { status: 201 });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ error: 'Domain already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
