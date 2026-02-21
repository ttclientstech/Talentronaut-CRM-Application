import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Source from '@/models/Source';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const body = await req.json();
        const { id } = params;

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

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const { id } = params;

        const source = await Source.findByIdAndDelete(id);

        if (!source) {
            return NextResponse.json({ error: 'Source not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Source deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
