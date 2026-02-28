'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronRight, Plus, Loader2, Mail, Phone } from 'lucide-react';
import FolderCard from '@/components/Common/FolderCard';

type Level = 'projects' | 'domains' | 'subdomains' | 'campaigns' | 'sources' | 'leads';

interface Breadcrumb {
    name: string;
    level: Level;
    id: string | null;
}

function ConfigurationContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [level, setLevel] = useState<Level>('projects');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([
        { name: 'Projects', level: 'projects', id: null }
    ]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [creating, setCreating] = useState(false);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
            let url = '/api/projects';

            if (level === 'projects') url = '/api/projects';
            else if (level === 'domains') url = `/api/domains?projectId=${lastBreadcrumb.id}`;
            else if (level === 'subdomains') url = `/api/subdomains?domainId=${lastBreadcrumb.id}`;
            else if (level === 'campaigns') url = `/api/campaigns?subdomainId=${lastBreadcrumb.id}`;
            else if (level === 'leads') url = `/api/leads?campaignId=${lastBreadcrumb.id}`;

            const res = await fetch(url);
            const data = await res.json();

            if (level === 'projects') setItems(data.projects || []);
            else if (level === 'domains') setItems(data.domains || []);
            else if (level === 'subdomains') setItems(data.subdomains || []);
            else if (level === 'campaigns') setItems(data.campaigns || []);
            else if (level === 'leads') setItems(data.leads || []);

        } catch (error) {
            console.error('Fetch failed', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [level, breadcrumbs]);

    const navigateTo = (nextLevel: Level, id: string, name: string) => {
        setBreadcrumbs([...breadcrumbs, { name, level: nextLevel, id }]);
        setLevel(nextLevel);
    };

    const handleBreadcrumbClick = (index: number) => {
        const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(newBreadcrumbs);
        setLevel(newBreadcrumbs[newBreadcrumbs.length - 1].level);
    };

    // Navigate to lead detail page within admin layout, passing breadcrumb context
    const navigateToLead = (leadId: string) => {
        // breadcrumbs: [Projects, domainName, subdomainName, campaignName, leadName]
        const domain = breadcrumbs[2]?.name || '';
        const campaign = breadcrumbs[4]?.name || '';
        const params = new URLSearchParams({ domain, campaign });
        router.push(`/admin/leads/${leadId}?${params.toString()}`);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        setCreating(true);
        try {
            const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
            let url = '/api/projects';
            let body: any = { name: newItemName };

            if (level === 'domains') { url = '/api/domains'; body.projectId = lastBreadcrumb.id; }
            else if (level === 'subdomains') { url = '/api/subdomains'; body.domainId = lastBreadcrumb.id; }
            else if (level === 'campaigns') { url = '/api/campaigns'; body.subdomainId = lastBreadcrumb.id; }
            else if (level === 'leads') { url = '/api/leads'; body.campaignId = lastBreadcrumb.id; }

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setNewItemName('');
                setShowCreateModal(false);
                fetchItems();
            }
        } catch (error) {
            console.error('Create failed', error);
        } finally {
            setCreating(false);
        }
    };

    // Listen to query parameters from the new Sidebar Explorer
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const action = params.get('action');
            if (action === 'new-project') {
                setLevel('projects');
                setBreadcrumbs([{ name: 'Projects', level: 'projects', id: null }]);
                setShowCreateModal(true);
                // Clean up the URL
                window.history.replaceState(null, '', '/admin/configuration');
                return;
            }

            const type = params.get('type');
            const id = params.get('id');
            const name = params.get('name');

            if (type && id && name) {
                // If the user clicks a folder in the sidebar, we want to view its *children*.
                if (type === 'project') {
                    setBreadcrumbs([
                        { name: 'Projects', level: 'projects', id: null },
                        { name, level: 'domains', id }
                    ]);
                    setLevel('domains');
                } else if (type === 'domain') {
                    setBreadcrumbs([
                        { name: 'Projects', level: 'projects', id: null },
                        { name, level: 'subdomains', id }
                    ]);
                    setLevel('subdomains');
                } else if (type === 'subdomain') {
                    setBreadcrumbs([
                        { name: 'Projects', level: 'projects', id: null },
                        { name, level: 'campaigns', id }
                    ]);
                    setLevel('campaigns');
                } else if (type === 'campaign') {
                    setBreadcrumbs([
                        { name: 'Projects', level: 'projects', id: null },
                        { name, level: 'leads', id }
                    ]);
                    setLevel('leads');
                }
            }
        }
    }, [pathname, searchParams]);

    const statusConfig: Record<string, { bg: string; text: string }> = {
        'New': { bg: 'bg-blue-50', text: 'text-blue-700' },
        'In Progress': { bg: 'bg-amber-50', text: 'text-amber-700' },
        'Won': { bg: 'bg-emerald-50', text: 'text-emerald-700' },
        'Lost': { bg: 'bg-red-50', text: 'text-red-700' },
        'Contacted': { bg: 'bg-purple-50', text: 'text-purple-700' },
        'Qualified': { bg: 'bg-teal-50', text: 'text-teal-700' },
        'Closed': { bg: 'bg-gray-100', text: 'text-gray-600' },
    };

    return (
        <div className="space-y-6">
            {/* Header & Breadcrumbs */}
            <div>
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-4 overflow-x-auto pb-2 whitespace-nowrap scrollbar-hide">
                    {breadcrumbs.map((b, i) => (
                        <div key={i} className="flex items-center gap-2 shrink-0">
                            {i > 0 && <ChevronRight className="h-4 w-4" />}
                            <button
                                onClick={() => handleBreadcrumbClick(i)}
                                className={`hover:text-primary transition-colors ${i === breadcrumbs.length - 1 ? 'font-semibold text-gray-900 underline underline-offset-4 decoration-primary' : ''}`}
                            >
                                {b.name}
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 capitalize tracking-tight">{level}</h1>
                        <p className="mt-2 text-gray-500 font-medium">
                            {level === 'projects' && 'Organize your sales verticals and services.'}
                            {level === 'domains' && `Domains under ${breadcrumbs[breadcrumbs.length - 1].name}.`}
                            {level === 'subdomains' && `Subdomains under ${breadcrumbs[breadcrumbs.length - 1].name}.`}
                            {level === 'campaigns' && `Campaigns running under ${breadcrumbs[breadcrumbs.length - 1].name}.`}
                            {level === 'sources' && `Lead origins for ${breadcrumbs[breadcrumbs.length - 1].name}.`}
                            {level === 'leads' && `Actual leads received from ${breadcrumbs[breadcrumbs.length - 1].name}.`}
                        </p>
                    </div>
                    {level !== 'leads' && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95"
                        >
                            <Plus className="h-5 w-5" />
                            New {level.slice(0, -1)}
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex h-96 items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary/30" />
                </div>
            ) : level === 'leads' ? (
                /* Full-width Leads Table */
                <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-200/50">
                    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="font-brand text-xl font-bold text-gray-900">{breadcrumbs[breadcrumbs.length - 1].name}</h2>
                            <p className="text-xs font-medium text-gray-400">{items.length} lead{items.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-1.5">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Live</span>
                        </div>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Prospect</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Company</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Assigned</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Contact</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-14 w-14 rounded-full bg-gray-50 flex items-center justify-center">
                                                <Plus className="h-7 w-7 text-gray-200" />
                                            </div>
                                            <p className="text-gray-400 font-medium italic text-sm">No leads from this source yet.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                items.map((lead) => {
                                    const s = statusConfig[lead.status] || statusConfig['New'];
                                    return (
                                        <tr key={lead._id}
                                            onClick={() => navigateToLead(lead._id)}
                                            className="hover:bg-gray-50/40 transition-colors cursor-pointer">
                                            {/* Prospect */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                                                        {lead.firstName?.[0] || '?'}{lead.lastName?.[0] || ''}

                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-gray-900 text-sm truncate">{lead.firstName} {lead.lastName}</p>
                                                        <p className="text-xs font-medium text-gray-400 truncate">{lead.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Company */}
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-gray-700 text-sm">{lead.company || <span className="text-gray-300 italic font-normal">—</span>}</span>
                                            </td>
                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                <select
                                                    defaultValue={lead.status}
                                                    onClick={e => e.stopPropagation()}
                                                    onChange={async (e) => {
                                                        e.stopPropagation();
                                                        await fetch(`/api/leads/${lead._id}`, {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ status: e.target.value }),
                                                        });
                                                        fetchItems();
                                                    }}
                                                    className={`rounded-xl px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 ${s.bg} ${s.text}`}
                                                >
                                                    {['New', 'In Progress', 'Contacted', 'Qualified', 'Won', 'Lost', 'Closed'].map(st => (
                                                        <option key={st} value={st}>{st}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            {/* Assigned */}
                                            <td className="px-6 py-4">
                                                {lead.assignedTo ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                            {lead.assignedTo.name?.[0]}
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-700">{lead.assignedTo.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-bold text-gray-300 italic">Unassigned</span>
                                                )}
                                            </td>
                                            {/* Contact */}
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()} className="h-8 w-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors">
                                                        <Mail className="h-3.5 w-3.5" />
                                                    </a>
                                                    {lead.phone && (
                                                        <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()} className="h-8 w-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors">
                                                            <Phone className="h-3.5 w-3.5" />
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
            ) : (
                /* Folders View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {items.length === 0 ? (
                        <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-[2rem] border-4 border-dashed border-gray-100 p-12 text-center">
                            <Plus className="h-12 w-12 text-gray-200 mb-4" />
                            <h3 className="text-xl font-bold text-gray-900">Start with a {level.slice(0, -1)}</h3>
                            <p className="mt-2 text-gray-400 font-medium max-w-xs">Create your first item to build your hierarchy structure.</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <FolderCard
                                key={item._id}
                                name={item.name}
                                description={item.status === 'Active' ? 'Active Project' : 'Paused'}
                                onClick={() => {
                                    if (level === 'projects') navigateTo('domains', item._id, item.name);
                                    else if (level === 'domains') navigateTo('subdomains', item._id, item.name);
                                    else if (level === 'subdomains') navigateTo('campaigns', item._id, item.name);
                                    else if (level === 'campaigns') navigateTo('leads', item._id, item.name);
                                }}
                            />
                        ))
                    )}
                </div>
            )
            }



            {/* Create Modal */}
            {
                showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                        <div className="w-full max-w-md rounded-[2rem] bg-white p-10 shadow-2xl">
                            <h3 className="text-3xl font-black text-gray-900 mb-2">New {level.slice(0, -1)}</h3>
                            <p className="text-gray-500 mb-8 font-medium">Enter a name for your new folder in {breadcrumbs[breadcrumbs.length - 1].name}.</p>
                            <form onSubmit={handleCreate} className="space-y-6">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    placeholder="e.g. AI Solutions Outreach"
                                    className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 text-lg font-bold placeholder:text-gray-300 focus:border-primary focus:bg-white focus:outline-none transition-all"
                                />
                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 rounded-2xl py-4 font-bold text-gray-400 hover:bg-gray-50 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={creating || !newItemName.trim()} className="flex-1 bg-primary text-white rounded-2xl py-4 font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50">
                                        {creating ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Create Folder'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

export default function ConfigurationPage() {
    return (
        <React.Suspense fallback={
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary/30" />
            </div>
        }>
            <ConfigurationContent />
        </React.Suspense>
    );
}
