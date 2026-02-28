'use client';

import { useState, useEffect } from 'react';
import { Calendar, Loader2, Save, CheckCircle2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AvailabilityPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    // Default 7 days
    const [schedule, setSchedule] = useState([
        { dayOfWeek: 1, name: 'Monday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 2, name: 'Tuesday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 3, name: 'Wednesday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 4, name: 'Thursday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 5, name: 'Friday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 6, name: 'Saturday', isAvailable: false, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 0, name: 'Sunday', isAvailable: false, startTime: '09:00', endTime: '17:00' },
    ]);

    useEffect(() => {
        if (session?.user?.role !== 'Lead' && session?.user?.role !== 'Admin') {
            if (session) router.push('/sales');
            return;
        }

        const fetchAvailability = async () => {
            try {
                const res = await fetch('/api/availability');
                const data = await res.json();

                if (data.availability && data.availability.length > 0) {
                    const merged = schedule.map(day => {
                        const dbDay = data.availability.find((d: any) => d.dayOfWeek === day.dayOfWeek);
                        if (dbDay) {
                            return { ...day, isAvailable: dbDay.isAvailable, startTime: dbDay.startTime, endTime: dbDay.endTime };
                        }
                        return day;
                    });
                    setSchedule(merged);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (session) {
            fetchAvailability();
        }
    }, [session, router]);

    const handleSave = async () => {
        setSaving(true);
        setSuccess(false);
        try {
            await fetch('/api/availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ availabilityData: schedule }),
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Save failed', err);
        } finally {
            setSaving(false);
        }
    };

    const updateDay = (idx: number, field: string, value: any) => {
        const newSchedule = [...schedule];
        newSchedule[idx] = { ...newSchedule[idx], [field]: value };
        setSchedule(newSchedule);
    };

    if (loading) return (
        <div className="flex h-[calc(100vh-100px)] items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary/30" />
        </div>
    );

    return (
        <div className="max-w-3xl space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-brand text-4xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <Calendar className="h-8 w-8 text-primary" /> My Availability
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Set your weekly recurring schedule for Sales Members to book meetings.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> :
                        success ? <CheckCircle2 className="h-5 w-5" /> : <Save className="h-5 w-5" />}
                    {success ? 'Saved!' : 'Save Schedule'}
                </button>
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden divide-y divide-gray-50">
                {schedule.map((day, idx) => (
                    <div key={day.dayOfWeek} className={`p-6 flex items-center gap-6 transition-colors ${day.isAvailable ? 'bg-white' : 'bg-gray-50/50'}`}>
                        {/* Toggle */}
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={day.isAvailable}
                                onChange={(e) => updateDay(idx, 'isAvailable', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>

                        {/* Day Name */}
                        <div className="w-32 shrink-0">
                            <span className={`text-sm font-bold ${day.isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>
                                {day.name}
                            </span>
                        </div>

                        {/* Times */}
                        <div className="flex items-center gap-4 flex-1">
                            {day.isAvailable ? (
                                <>
                                    <input
                                        type="time"
                                        value={day.startTime}
                                        onChange={(e) => updateDay(idx, 'startTime', e.target.value)}
                                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                    <span className="text-gray-400 font-bold text-xs">to</span>
                                    <input
                                        type="time"
                                        value={day.endTime}
                                        onChange={(e) => updateDay(idx, 'endTime', e.target.value)}
                                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </>
                            ) : (
                                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">Unavailable</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
