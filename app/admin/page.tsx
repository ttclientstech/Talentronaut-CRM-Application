'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Users,
    TrendingUp,
    DollarSign,
    Zap,
    RefreshCw,
    Award,
    BarChart2,
    Layers,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';

const PIE_COLORS = ['#d4503a', '#f0a090', '#b83a24', '#e86c56', '#8b2015', '#f5c4ba', '#7a3020', '#e08070'];

interface DashboardData {
    stats: {
        totalLeads: number;
        conversionRate: string;
        revenuePipeline: number;
    };
    chartData: { date: string; leads: number }[];
    sourceStats: { _id: string; value: number }[];
    teamPerformance: { _id: string; name: string; activeLeads: number; closureRate: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3">
                <p className="text-xs font-bold text-gray-400 mb-1">{label}</p>
                <p className="text-lg font-black text-gray-900">{payload[0].value} leads</p>
            </div>
        );
    }
    return null;
};

const PieCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="900">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export default function AdminDashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [chartDays, setChartDays] = useState(7);
    const [chartMode, setChartMode] = useState<'Daily' | 'Weekly'>('Daily');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const days = chartMode === 'Daily' ? chartDays : 28;
            const res = await fetch(`/api/admin/stats?days=${days}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (err) {
            console.error('Admin stats error:', err);
        } finally {
            setLoading(false);
        }
    }, [chartDays, chartMode]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Aggregate weekly data from daily
    const getChartData = () => {
        if (!data) return [];
        if (chartMode === 'Daily') return data.chartData;
        // Group days into weeks
        const weekly: { date: string; leads: number }[] = [];
        const days = data.chartData;
        for (let i = 0; i < days.length; i += 7) {
            const chunk = days.slice(i, i + 7);
            const total = chunk.reduce((acc, d) => acc + d.leads, 0);
            weekly.push({ date: `Wk ${Math.floor(i / 7) + 1}`, leads: total });
        }
        return weekly;
    };

    const formatCurrency = (n: number) =>
        n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`;

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-sm font-semibold text-gray-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const chartData = getChartData();
    const maxLeads = Math.max(...(chartData.map(d => d.leads)), 1);

    return (
        <div className="space-y-8 pb-10">

            {/* ── Global Stats Row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    {
                        label: 'Total Leads',
                        value: data?.stats.totalLeads ?? 0,
                        icon: Users,
                        sub: 'All time',
                        color: 'text-blue-600',
                        bg: 'bg-blue-50',
                    },
                    {
                        label: 'Conversion Rate',
                        value: `${data?.stats.conversionRate ?? '0'}%`,
                        icon: TrendingUp,
                        sub: 'Won leads',
                        color: 'text-emerald-600',
                        bg: 'bg-emerald-50',
                    },
                    {
                        label: 'Revenue Pipeline',
                        value: formatCurrency(data?.stats.revenuePipeline ?? 0),
                        icon: DollarSign,
                        sub: 'From won leads',
                        color: 'text-primary',
                        bg: 'bg-primary/5',
                    },
                ].map((card) => (
                    <div
                        key={card.label}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition-shadow"
                    >
                        <div className={`h-14 w-14 rounded-2xl ${card.bg} flex items-center justify-center shrink-0`}>
                            <card.icon className={`h-7 w-7 ${card.color}`} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{card.label}</p>
                            <p className="text-3xl font-black text-gray-900 mt-0.5">{card.value}</p>
                            <p className="text-xs font-medium text-gray-400 mt-0.5">{card.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Lead Volume Bar Chart */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                                <BarChart2 className="h-5 w-5 text-primary" />
                                Lead Volume
                            </h2>
                            <p className="text-xs font-medium text-gray-400 mt-0.5">Leads arriving over time</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Daily / Weekly toggle */}
                            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                                {(['Daily', 'Weekly'] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setChartMode(mode)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartMode === mode
                                            ? 'bg-white text-primary shadow-sm'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                            {/* Day range selector (only for Daily) */}
                            {chartMode === 'Daily' && (
                                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                                    {[7, 14, 30].map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => setChartDays(d)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartDays === d
                                                ? 'bg-white text-primary shadow-sm'
                                                : 'text-gray-400 hover:text-gray-600'
                                                }`}
                                        >
                                            {d}d
                                        </button>
                                    ))}
                                </div>
                            )}
                            <button
                                onClick={fetchData}
                                className="h-8 w-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    {chartData.every(d => d.leads === 0) ? (
                        <div className="flex flex-col items-center justify-center h-52 gap-3">
                            <BarChart2 className="h-10 w-10 text-gray-200" />
                            <p className="text-sm font-medium text-gray-400">No lead data for this period</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={chartData} barSize={chartMode === 'Daily' && chartDays > 14 ? 10 : 22}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval="preserveEnd"
                                    minTickGap={10}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fontSize: 11, fontWeight: 700, fill: '#9ca3af' }}
                                    axisLine={false}
                                    tickLine={false}
                                    domain={[0, maxLeads + 1]}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fdf6f5' }} />
                                <Bar dataKey="leads" fill="#d4503a" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Source Breakdown Pie Chart */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7 flex flex-col">
                    <div className="mb-4">
                        <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                            <Layers className="h-5 w-5 text-primary" />
                            Source Breakdown
                        </h2>
                        <p className="text-xs font-medium text-gray-400 mt-0.5">Lead origin distribution</p>
                    </div>

                    {(!data?.sourceStats || data.sourceStats.length === 0) ? (
                        <div className="flex flex-col items-center justify-center flex-1 gap-3">
                            <Layers className="h-10 w-10 text-gray-200" />
                            <p className="text-sm font-medium text-gray-400 text-center">No source data yet</p>
                        </div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie
                                        data={data.sourceStats}
                                        dataKey="value"
                                        nameKey="_id"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        innerRadius={40}
                                        labelLine={false}
                                        label={PieCustomLabel}
                                    >
                                        {data.sourceStats.map((_, idx) => (
                                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val, name) => [`${val} leads`, name]}
                                        contentStyle={{ borderRadius: 12, border: '1px solid #f3f4f6', fontSize: 12 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Custom Legend */}
                            <div className="space-y-2 mt-2">
                                {data.sourceStats.slice(0, 5).map((s, idx) => (
                                    <div key={s._id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                                style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                                            />
                                            <span className="text-xs font-semibold text-gray-600 truncate max-w-[120px]">
                                                {s._id}
                                            </span>
                                        </div>
                                        <span className="text-xs font-black text-gray-900 tabular-nums">{s.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Team Performance ── */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-3">
                    <Award className="h-5 w-5 text-primary" />
                    <div>
                        <h2 className="text-base font-black text-gray-900">Team Performance</h2>
                        <p className="text-xs font-medium text-gray-400">Sales members · active leads &amp; closure rates</p>
                    </div>
                </div>

                {(!data?.teamPerformance || data.teamPerformance.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Users className="h-10 w-10 text-gray-200" />
                        <p className="text-sm font-medium text-gray-400">No team data available yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {/* Table header */}
                        <div className="grid grid-cols-4 px-8 py-3 bg-gray-50/50">
                            {['Member', 'Active Leads', 'Closure Rate', 'Performance'].map((h) => (
                                <p key={h} className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    {h}
                                </p>
                            ))}
                        </div>
                        {data.teamPerformance.map((member, i) => {
                            const rate = Math.round(member.closureRate);
                            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                            return (
                                <div
                                    key={member._id}
                                    className="grid grid-cols-4 px-8 py-4 items-center hover:bg-gray-50/40 transition-colors"
                                >
                                    {/* Member */}
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                                            {member.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">
                                                {member.name} {medal}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Active Leads */}
                                    <div>
                                        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-black px-3 py-1.5 rounded-xl">
                                            <Zap className="h-3 w-3" />
                                            {member.activeLeads} active
                                        </span>
                                    </div>
                                    {/* Closure Rate */}
                                    <div>
                                        <span className={`text-sm font-black ${rate >= 50 ? 'text-emerald-600' : rate >= 20 ? 'text-amber-600' : 'text-red-500'}`}>
                                            {rate}%
                                        </span>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="pr-4">
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{
                                                    width: `${Math.min(rate, 100)}%`,
                                                    backgroundColor: rate >= 50 ? '#10b981' : rate >= 20 ? '#f59e0b' : '#d4503a',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    );
}
