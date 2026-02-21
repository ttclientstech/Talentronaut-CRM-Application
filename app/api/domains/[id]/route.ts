import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Domain from '@/models/Domain';

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: RouteParams) {
    try {
        await dbConnect();
        const body = await req.json();
        const { id } = await params;

        const domain = await Domain.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        });

        if (!domain) {
            return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
        }

        return NextResponse.json({ domain });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        await dbConnect();
        const { id } = await params;

        // Optionally check for child Campaigns before deleting
        const domain = await Domain.findByIdAndDelete(id);

        if (!domain) {
            return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Domain deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
