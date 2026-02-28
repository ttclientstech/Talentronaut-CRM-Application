import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Subdomain from '@/models/Subdomain';
import Domain from '@/models/Domain';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const domainId = searchParams.get('domainId');

        let query = {};
        if (domainId) {
            query = { domain: domainId };
        }

        const subdomains = await Subdomain.find(query).sort({ createdAt: -1 });

        return NextResponse.json({ subdomains }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching subdomains:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        const { name, domainId } = body;

        if (!name || !domainId) {
            return NextResponse.json({ error: 'Name and domainId are required' }, { status: 400 });
        }

        const domain = await Domain.findById(domainId);
        if (!domain) {
            return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
        }

        const newSubdomain = new Subdomain({
            name,
            domain: domainId,
            status: 'Active',
        });

        await newSubdomain.save();

        return NextResponse.json(
            { message: 'Subdomain created successfully', subdomain: newSubdomain },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating subdomain:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
