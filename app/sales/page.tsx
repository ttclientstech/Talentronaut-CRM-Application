'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    UserCheck,
    CalendarCheck,
    AlertTriangle,
    Bell,
    Loader2,
    RefreshCw,
    CheckCircle2,
    Clock,
    ChevronRight,
    Zap,
    TrendingUp,
    FolderKanban,
    Mail,
    Phone,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Lead {
    _id: string;
    firstName: string;
    lastName: string;
    company?: string;
    email: string;
    phone?: string;
    status: string;
    source?: { name: string };
    meetings?: { _id: string; title: string; date: string; status: string }[];
}

interface MyDayData {
    assignedToday: Lead[];
    activeLeads: Lead[];
    stats: {
        totalAssigned: number;
        convertedLeads: number;
        leadsToday: number;
    };
    notifications: { id: number; type: string; message: string; time: string }[];
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
    'New': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    'Contacted': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
    'In Progress': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    'Qualified': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100' },
    'Won': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
    'Lost': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' },
    'Closed': { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
};

const NOTIF_STYLE: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    info: { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-50' },
    success: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
    lead: { icon: UserCheck, color: 'text-primary', bg: 'bg-primary/5' },
    meeting: { icon: CalendarCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
};

export default function SalesDashboardPage() {
    const router = useRouter();
    const [data, setData] = useState<MyDayData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'info' | 'lead' | 'meeting'>('all');
    const [dismissedNotifs, setDismissedNotifs] = useState<number[]>([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/sales/my-day');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (err) {
            console.error('Sales my-day error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Build meetings from active leads
    const todayISO = new Date().toDateString();
    const todayMeetings = (data?.activeLeads || []).flatMap(lead =>
        (lead.meetings || [])
            .filter(m => m.status === 'Scheduled' && new Date(m.date).toDateString() === todayISO)
            .map(m => ({ ...m, leadName: `${lead.firstName} ${lead.lastName}`, leadId: lead._id }))
    );

    // Overdue follow-ups: leads in active status not contacted recently
    const overdueLeads = (data?.activeLeads || []).filter(lead => lead.status === 'New');

    // Conversion rate
    const convRate = data?.stats.totalAssigned
        ? Math.round((data.stats.convertedLeads / data.stats.totalAssigned) * 100)
        : 0;

    // Filtered notifications
    const visibleNotifs = (data?.notifications || [])
        .filter(n => !dismissedNotifs.includes(n.id))
        .filter(n => activeTab === 'all' || n.type === activeTab);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-sm font-semibold text-gray-400">Loading your day...</p>
                </div>
            </div>
        );
    }

    const now = new Date();
    const dayGreeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
    const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="space-y-8 pb-10">

            {/* ── Header ── */}
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{dateStr}</p>
                    <h1 className="text-3xl font-black text-gray-900 mt-1">{dayGreeting} 👋</h1>
                    <p className="text-gray-400 font-medium mt-1">Here's what's on your plate today.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="h-10 w-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
                >
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            {/* ── Quick Stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Leads Today', value: data?.stats.leadsToday ?? 0, icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Meetings Today', value: todayMeetings.length, icon: CalendarCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Follow-ups Overdue', value: overdueLeads.length, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'My Conversion', value: `${convRate}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((card) => (
                    <div
                        key={card.label}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
                    >
                        <div className={`h-11 w-11 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                            <card.icon className={`h-5 w-5 ${card.color}`} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{card.label}</p>
                            <p className="text-2xl font-black text-gray-900">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* My Day View */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Leads Assigned Today */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-7 py-5 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <UserCheck className="h-5 w-5 text-primary" />
                                <div>
                                    <h2 className="text-sm font-black text-gray-900">Leads Assigned Today</h2>
                                    <p className="text-xs text-gray-400 font-medium">{data?.assignedToday.length || 0} new lead{data?.assignedToday.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => router.push('/sales/leads')}
                                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                            >
                                All Leads <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        {(!data?.assignedToday || data.assignedToday.length === 0) ? (
                            <div className="py-12 flex flex-col items-center gap-3">
                                <FolderKanban className="h-10 w-10 text-gray-200" />
                                <p className="text-sm font-medium text-gray-400">No new leads assigned today</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {data.assignedToday.map((lead) => {
                                    const s = STATUS_CONFIG[lead.status] || STATUS_CONFIG['New'];
                                    return (
                                        <div
                                            key={lead._id}
                                            onClick={() => router.push('/sales/leads')}
                                            className="px-7 py-4 flex items-center justify-between hover:bg-gray-50/50 cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                                                    {lead.firstName?.[0]}{lead.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                                                        {lead.firstName} {lead.lastName}
                                                    </p>
                                                    <p className="text-xs text-gray-400 font-medium">{lead.company || lead.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest border ${s.bg} ${s.text} ${s.border}`}>
                                                    {lead.status}
                                                </span>
                                                <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                                                    <a href={`mailto:${lead.email}`} className="h-7 w-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300 hover:text-primary transition-colors">
                                                        <Mail className="h-3 w-3" />
                                                    </a>
                                                    {lead.phone && (
                                                        <a href={`tel:${lead.phone}`} className="h-7 w-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300 hover:text-primary transition-colors">
                                                            <Phone className="h-3 w-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Meetings Scheduled Today */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-7 py-5 border-b border-gray-50 flex items-center gap-2">
                            <CalendarCheck className="h-5 w-5 text-purple-600" />
                            <div>
                                <h2 className="text-sm font-black text-gray-900">Meetings Today</h2>
                                <p className="text-xs text-gray-400 font-medium">{todayMeetings.length} scheduled</p>
                            </div>
                        </div>

                        {todayMeetings.length === 0 ? (
                            <div className="py-10 flex flex-col items-center gap-3">
                                <CalendarCheck className="h-10 w-10 text-gray-200" />
                                <p className="text-sm font-medium text-gray-400">No meetings scheduled for today</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {todayMeetings.map((m) => (
                                    <div key={m._id} className="px-7 py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                                                <CalendarCheck className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{m.title}</p>
                                                <p className="text-xs text-gray-400 font-medium">with {m.leadName}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-purple-600">
                                                {new Date(m.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">Today</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Overdue Follow-Ups */}
                    {overdueLeads.length > 0 && (
                        <div className="bg-amber-50 rounded-3xl border border-amber-100 overflow-hidden">
                            <div className="px-7 py-5 border-b border-amber-100 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                <div>
                                    <h2 className="text-sm font-black text-amber-800">Overdue Follow-Ups</h2>
                                    <p className="text-xs text-amber-600 font-medium">{overdueLeads.length} lead{overdueLeads.length !== 1 ? 's' : ''} need attention</p>
                                </div>
                            </div>
                            <div className="divide-y divide-amber-100">
                                {overdueLeads.slice(0, 4).map((lead) => (
                                    <div
                                        key={lead._id}
                                        onClick={() => router.push('/sales/leads')}
                                        className="px-7 py-4 flex items-center justify-between hover:bg-amber-100/40 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-black text-xs shrink-0">
                                                {lead.firstName?.[0]}{lead.lastName?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-amber-900">
                                                    {lead.firstName} {lead.lastName}
                                                </p>
                                                <p className="text-xs text-amber-600 font-medium">{lead.company || 'No company'}</p>
                                            </div>
                                        </div>
                                        <Clock className="h-4 w-4 text-amber-400" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Notification Center */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-7 py-5 border-b border-gray-50">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Bell className="h-5 w-5 text-primary" />
                                <h2 className="text-sm font-black text-gray-900">Notifications</h2>
                            </div>
                            {visibleNotifs.length > 0 && (
                                <span className="h-5 min-w-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center px-1.5">
                                    {visibleNotifs.length}
                                </span>
                            )}
                        </div>
                        {/* Filter tabs */}
                        <div className="flex gap-1 flex-wrap">
                            {(['all', 'info', 'lead', 'meeting'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === tab
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {visibleNotifs.length === 0 ? (
                            <div className="py-16 flex flex-col items-center gap-3">
                                <Bell className="h-10 w-10 text-gray-200" />
                                <p className="text-sm font-medium text-gray-400 text-center">All caught up! 🎉</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {visibleNotifs.map((notif) => {
                                    const style = NOTIF_STYLE[notif.type] || NOTIF_STYLE['info'];
                                    const Icon = style.icon;
                                    return (
                                        <div key={notif.id} className="px-6 py-4 flex items-start gap-3 group hover:bg-gray-50/50 transition-colors">
                                            <div className={`h-8 w-8 rounded-xl ${style.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                                                <Icon className={`h-4 w-4 ${style.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 leading-snug">{notif.message}</p>
                                                <p className="text-xs font-medium text-gray-400 mt-1">{notif.time}</p>
                                            </div>
                                            <button
                                                onClick={() => setDismissedNotifs(prev => [...prev, notif.id])}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-gray-500 shrink-0"
                                                title="Dismiss"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Quick links */}
                    <div className="px-6 py-5 border-t border-gray-50 space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Quick Access</p>
                        {[
                            { label: 'View All Leads', href: '/sales/leads', icon: FolderKanban },
                            { label: 'Total Assigned', value: data?.stats.totalAssigned, icon: Zap },
                            { label: 'Converted', value: data?.stats.convertedLeads, icon: TrendingUp },
                        ].map((item) => (
                            <div
                                key={item.label}
                                onClick={() => 'href' in item && router.push(item.href as string)}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${'href' in item ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
                            >
                                <div className="flex items-center gap-2">
                                    <item.icon className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm font-semibold text-gray-600">{item.label}</span>
                                </div>
                                {'value' in item ? (
                                    <span className="text-sm font-black text-gray-900">{item.value}</span>
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-300" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
