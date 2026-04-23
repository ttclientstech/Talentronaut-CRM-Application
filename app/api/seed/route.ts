import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { v4 as uuidv4 } from 'uuid';

async function seedAdmin() {
    await dbConnect();

    const adminEmail = 'admin@talentronaut.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
        return {
            message: 'Admin already exists',
            admin: {
                email: existingAdmin.email,
                accessCode: existingAdmin.accessCode,
            },
        };
    }

    const adminCode = uuidv4();
    const admin = await User.create({
        name: 'Super Admin',
        email: adminEmail,
        role: 'Admin',
        accessCode: adminCode,
        status: 'Active',
    });

    return {
        message: 'Admin created successfully',
        admin: {
            email: admin.email,
            accessCode: admin.accessCode,
        },
    };
}

export async function GET() {
    try {
        const result = await seedAdmin();
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST() {
    try {
        const result = await seedAdmin();
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
