import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { v4 as uuidv4 } from 'uuid';

export async function POST() {
    try {
        await dbConnect();

        const adminEmail = 'admin@talentronaut.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            return NextResponse.json({
                message: 'Admin already exists',
                admin: {
                    email: existingAdmin.email,
                    accessCode: existingAdmin.accessCode
                }
            });
        }

        const adminCode = uuidv4();
        const admin = await User.create({
            name: 'Super Admin',
            email: adminEmail,
            role: 'Admin',
            accessCode: adminCode,
            status: 'Active'
        });

        return NextResponse.json({
            message: 'Admin created successfully',
            admin: {
                email: admin.email,
                accessCode: admin.accessCode
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
