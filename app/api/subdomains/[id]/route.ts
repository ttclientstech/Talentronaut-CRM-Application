import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subdomain from '@/models/Subdomain';

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: RouteParams) {
    try {
        await dbConnect();
        const body = await req.json();
        const { id } = await params;

        const subdomain = await Subdomain.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        });

        if (!subdomain) {
            return NextResponse.json({ error: 'Subdomain not found' }, { status: 404 });
        }

        return NextResponse.json({ subdomain });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        await dbConnect();
        const { id } = await params;

        const subdomain = await Subdomain.findByIdAndDelete(id);

        if (!subdomain) {
            return NextResponse.json({ error: 'Subdomain not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Subdomain deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
