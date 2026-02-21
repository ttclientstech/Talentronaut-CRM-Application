'use client';

import { useState, useEffect } from 'react';
import { Mail, Phone, Loader2, Search, Users } from 'lucide-react';
import LeadDetailPanel from '@/components/LeadDetailPanel';

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
    'New': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    'Contacted': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
    'In Progress': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    'Needs Analysis': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
    'Proposal Sent': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
    'Qualified': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100' },
    'Won': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
    'Lost': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' },
    'Closed': { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
};

export default function SalesLeadsPage() {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

    const fetchLeads = async () => {
        try {
            const res = await fetch('/api/sales/leads');
            const data = await res.json();
            setLeads(data.leads || []);
        } catch (error) {
            console.error('Failed to fetch leads', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const filteredLeads = leads.filter(lead =>
        `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary/30" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-brand text-4xl font-bold text-gray-900 tracking-tight">My Leads</h1>
                    <p className="text-gray-500 font-medium">Manage your assigned prospects and follow-ups.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search leads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-6 text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all w-64"
                    />
                </div>
            </div>

            {/* Full-width Leads Table */}
            <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-xl shadow-gray-200/40">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Prospect</th>
                            <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Company</th>
                            <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Source</th>
                            <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
                            <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Contact</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredLeads.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center">
                                            <Users className="h-8 w-8 text-gray-200" />
                                        </div>
                                        <p className="text-gray-400 font-medium italic">
                                            {leads.length === 0
                                                ? 'No leads have been assigned to you yet.'
                                                : 'No leads found matching your search.'}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredLeads.map((lead) => {
                                const s = STATUS_CONFIG[lead.status] || STATUS_CONFIG['New'];
                                return (
                                    <tr
                                        key={lead._id}
                                        onClick={() => setSelectedLeadId(lead._id)}
                                        className="group hover:bg-gray-50/50 transition-colors cursor-pointer"
                                    >
                                        {/* Prospect */}
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm shrink-0">
                                                    {lead.firstName?.[0]}{lead.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{lead.firstName} {lead.lastName}</p>
                                                    <p className="text-xs font-medium text-gray-400">{lead.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Company */}
                                        <td className="px-8 py-5">
                                            <span className="font-bold text-gray-700">{lead.company || <span className="text-gray-300 italic font-normal">—</span>}</span>
                                        </td>
                                        {/* Source */}
                                        <td className="px-8 py-5">
                                            <span className="inline-block rounded-lg bg-primary/5 text-primary text-xs font-bold px-2.5 py-1">
                                                {lead.source?.name || 'Manual Entry'}
                                            </span>
                                        </td>
                                        {/* Status */}
                                        <td className="px-8 py-5">
                                            <span className={`rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border ${s.bg} ${s.text} ${s.border}`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        {/* Contact */}
                                        <td className="px-8 py-5" onClick={e => e.stopPropagation()}>
                                            <div className="flex gap-2">
                                                <a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()} className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary transition-colors">
                                                    <Mail className="h-4 w-4" />
                                                </a>
                                                {lead.phone && (
                                                    <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()} className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary transition-colors">
                                                        <Phone className="h-4 w-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Lead Detail Modal */}
            {selectedLeadId && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={() => setSelectedLeadId(null)}
                >
                    <div
                        className="relative w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl overflow-hidden"
                        style={{ height: '90vh' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <LeadDetailPanel
                            leadId={selectedLeadId}
                            onClose={() => setSelectedLeadId(null)}
                            onDeleted={() => { setSelectedLeadId(null); fetchLeads(); }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
