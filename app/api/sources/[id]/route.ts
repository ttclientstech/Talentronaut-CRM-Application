import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Source from '@/models/Source';

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: RouteParams) {
    try {
        await dbConnect();
        const body = await req.json();
        const { id } = await params;

        const source = await Source.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        });

        if (!source) {
            return NextResponse.json({ error: 'Source not found' }, { status: 404 });
        }

        return NextResponse.json({ source });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        await dbConnect();
        const { id } = await params;

        const source = await Source.findByIdAndDelete(id);

        if (!source) {
            return NextResponse.json({ error: 'Source not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Source deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
