import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const data = await req.json();

        // Basic validation for required fields from external sources
        const { firstName, lastName, email, phone, company, sourceType = 'Website', sourceUrl } = data;

        if (!firstName || !email) {
            return NextResponse.json(
                { success: false, error: 'firstName and email are required fields.' },
                { status: 400 }
            );
        }

        // Validate sourceType enum
        const validSourceTypes = ['Website', 'Meta', 'Manual', 'Other'];
        const finalSourceType = validSourceTypes.includes(sourceType) ? sourceType : 'Other';

        // Check if lead already exists by email (prevent duplicates)
        let lead = await Lead.findOne({ email });

        if (lead) {
            // If lead exists, we might just want to update it or log an event, but for now we skip creating a duplicate
            return NextResponse.json(
                { success: true, message: 'Lead already exists.', leadId: lead._id },
                { status: 200 }
            );
        }

        // Create new lead
        lead = await Lead.create({
            firstName,
            lastName: lastName || '', // Provide fallback empty string if last name isn't provided
            email,
            phone,
            company,
            sourceType: finalSourceType,
            sourceUrl,
            status: 'New', // Automatically marked as New Lead
            value: 0
        });

        // Optional: you could implement logic here to assign the lead round-robin to available 'Members'.
        // For now, it stays unassigned and visible on the Member dashboard to "claim" or "call".

        return NextResponse.json(
            { success: true, message: 'Lead ingested successfully.', leadId: lead._id },
            { status: 201 }
        );
    } catch (error) {
        console.error('Webhook Lead Ingestion Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error while processing lead.' },
            { status: 500 }
        );
    }
}
