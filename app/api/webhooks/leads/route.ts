import { NextResponse } from 'next/server';
import { ingestExternalLead, type LeadIngestionPayload } from '@/lib/leadIngestion';

const DEFAULT_ALLOWED_ORIGINS = [
    'https://campaign.talentronaut.in',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
];

function getAllowedOrigins() {
    const configuredOrigins = process.env.CRM_ALLOWED_ORIGINS
        ?.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    return configuredOrigins?.length ? configuredOrigins : DEFAULT_ALLOWED_ORIGINS;
}

function getCorsHeaders(req: Request) {
    const origin = req.headers.get('origin') || '';
    const allowedOrigins = getAllowedOrigins();
    const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-CRM-Webhook-Secret',
        'Vary': 'Origin',
    };
}

function isAuthorized(req: Request) {
    const secret = process.env.CRM_WEBHOOK_SECRET;
    if (!secret) return true;

    return req.headers.get('x-crm-webhook-secret') === secret;
}

export async function OPTIONS(req: Request) {
    return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function POST(req: Request) {
    const headers = getCorsHeaders(req);

    if (!isAuthorized(req)) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized webhook request.' },
            { status: 401, headers }
        );
    }

    try {
        const payload = await req.json() as LeadIngestionPayload;
        payload.requestOrigin = req.headers.get('x-crm-origin') || req.headers.get('origin') || payload.sourceUrl;
        const result = await ingestExternalLead(payload);

        return NextResponse.json(
            {
                success: true,
                message: result.created ? 'Lead ingested successfully.' : 'Existing lead updated successfully.',
                leadId: result.lead._id,
                created: result.created,
                taxonomy: result.taxonomy,
            },
            { status: result.created ? 201 : 200, headers }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error while processing lead.';
        const status = message.includes('required') ? 400 : 500;
        console.error('Webhook Lead Ingestion Error:', error);

        return NextResponse.json(
            { success: false, error: message },
            { status, headers }
        );
    }
}
