# External Form Integrations

Use one CRM endpoint for every public website form:

```txt
POST https://<crm-domain>/api/webhooks/leads
```

The endpoint creates the hierarchy automatically:

```txt
Project -> Domain -> Subdomain -> Campaign -> Source -> Lead
```

For the Budget Campaign form at `https://campaign.talentronaut.in/`, submissions are routed to:

```txt
Talentronaut
  Budget App
    Budget Campaign Forms
      Budget Campaign
        campaign.talentronaut.in
```

## CRM Environment

Set these on the CRM deployment:

```env
CRM_ALLOWED_ORIGINS=https://campaign.talentronaut.in
CRM_WEBHOOK_SECRET=use-a-long-random-secret
```

`CRM_WEBHOOK_SECRET` is optional in code, but strongly recommended if the form app can post from a serverless API route.

## Budget Campaign Payload

```json
{
  "appName": "Budget App",
  "formId": "budget-campaign",
  "formName": "Budget Campaign Report Modal",
  "fullName": "John Doe",
  "phone": "+91 9876543210",
  "whatsapp": "+91 9876543210",
  "email": "john@example.com",
  "sourceType": "Website",
  "sourceUrl": "https://campaign.talentronaut.in/",
  "details": {
    "phoneCountry": "IN +91",
    "whatsappCountry": "IN +91",
    "cta": "Project Report Modal"
  }
}
```

Only `fullName` or `firstName`, and `email`, are required. Send `appName` to control the top-level folder name, then optionally send `projectName`, `domainName`, `subdomainName`, `campaignName`, and `sourceName` if you want a fully explicit route.

The CRM will use this precedence:

1. Explicit payload fields like `projectName` or `domainName`.
2. Known app rules like `appName: Budget App` or Talentronaut website contact forms.
3. A safe fallback derived from the app or host name.

## Recommended Vercel Setup

In the Budget Campaign app, create a server API route so the secret is not exposed in browser JavaScript.

```ts
// app/api/crm-lead/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();

  const response = await fetch(`${process.env.CRM_BASE_URL}/api/webhooks/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CRM-Origin': 'https://campaign.talentronaut.in',
      'X-CRM-Webhook-Secret': process.env.CRM_WEBHOOK_SECRET || '',
    },
    body: JSON.stringify({
      appName: 'Budget App',
      formId: 'budget-campaign',
      formName: 'Budget Campaign Report Modal',
      sourceType: 'Website',
      sourceUrl: 'https://campaign.talentronaut.in/',
      ...body,
    }),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
```

Set these on the Budget Campaign Vercel project:

```env
CRM_BASE_URL=https://<crm-domain>
CRM_WEBHOOK_SECRET=the-same-secret-as-the-crm
```

Then call the Budget app API route from the modal submit handler:

```ts
await fetch('/api/crm-lead', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fullName,
    phone,
    whatsapp,
    email,
    details: {
      phoneCountry,
      whatsappCountry,
      cta: 'Project Report Modal',
    },
  }),
});
```

## Direct Browser Option

If the Budget app cannot add a server API route, post directly from the browser and leave `CRM_WEBHOOK_SECRET` unset on the CRM:

```ts
await fetch('https://<crm-domain>/api/webhooks/leads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    requestOrigin: 'https://campaign.talentronaut.in',
    appName: 'Budget App',
    formId: 'budget-campaign',
    formName: 'Budget Campaign Report Modal',
    fullName,
    phone,
    whatsapp,
    email,
    sourceType: 'Website',
    sourceUrl: 'https://campaign.talentronaut.in/',
  }),
});
```

This is easier, but less protected because any allowed browser origin can submit leads.

## Adding More Websites

For each new website or product form:

1. Add the website origin to `CRM_ALLOWED_ORIGINS`.
2. Send `appName` for the product or website, and add `projectName`, `domainName`, `subdomainName`, `campaignName`, and `sourceName` if you want a custom folder path.
3. Send product-specific fields under `details`.

Example:

```json
{
  "requestOrigin": "https://talentronaut.in",
  "appName": "Talentronaut Website",
  "formId": "ai-consulting-contact",
  "formName": "AI Consulting Contact Form",
  "fullName": "Priya Shah",
  "email": "priya@example.com",
  "phone": "+91 9000000000",
  "projectName": "Talentronaut",
  "domainName": "Talentronaut",
  "subdomainName": "AI Consulting",
  "campaignName": "Website Leads",
  "sourceName": "talentronaut.in/contact",
  "sourceType": "Website",
  "sourceUrl": "https://talentronaut.in/contact",
  "details": {
    "serviceInterest": "AI chatbot",
    "budgetRange": "2L-5L"
  }
}
```
