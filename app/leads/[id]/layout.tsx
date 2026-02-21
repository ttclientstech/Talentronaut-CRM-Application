import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Lead Detail — Talentronaut CRM',
};

export default function LeadDetailLayout({ children }: { children: React.ReactNode }) {
    // This layout intentionally has no sidebar — lead detail is a focused full-screen view.
    return <>{children}</>;
}
