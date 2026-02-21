'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItem {
    _id: string;
    title: string;
    message: string;
    type: 'Lead' | 'Meeting' | 'System';
    read: boolean;
    link?: string;
    createdAt: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications?unread=true');
            const data = await res.json();
            if (data.success) {
                setNotifications(data.data);
            }
        } catch (error) {
            console.error('Error fetching notifications', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Option to poll every minute:
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id?: string) => {
        try {
            setLoading(true);
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(id ? { notificationId: id } : {}),
            });
            const data = await res.json();
            if (data.success) {
                if (id) {
                    setNotifications(prev => prev.filter(n => n._id !== id));
                } else {
                    setNotifications([]);
                }
            }
        } catch (error) {
            console.error('Error updating notification', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notification: NotificationItem) => {
        await markAsRead(notification._id);
        if (notification.link) {
            setIsOpen(false);
            router.push(notification.link);
        }
    };

    const unreadLeadsCount = notifications.filter(n => n.type === 'Lead').length;

    return (
        <div className="w-full shrink-0 z-[100] relative flex flex-col bg-white border-b border-gray-200">
            {/* New Leads Banner */}
            {unreadLeadsCount > 0 && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 text-center text-sm font-medium w-full shadow-sm flex items-center justify-center gap-2">
                    <span className="animate-pulse h-2 w-2 rounded-full bg-white mr-1"></span>
                    You have <strong>{unreadLeadsCount}</strong> new lead{unreadLeadsCount > 1 ? 's' : ''} assigned!
                    <button
                        onClick={() => router.push('/sales/leads')}
                        className="ml-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs transition-colors"
                    >
                        View Leads
                    </button>
                </div>
            )}

            {/* Header Area */}
            <div className="w-full h-16 flex justify-end items-center px-8">
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 rounded-full bg-gray-50 shadow-sm border border-gray-200 hover:bg-gray-100 relative focus:outline-none transition-colors"
                        aria-label="Notifications"
                    >
                        <Bell className="w-5 h-5 text-gray-700" />
                        {notifications.length > 0 && (
                            <span className="absolute top-0 right-0 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {isOpen && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl overflow-hidden z-[100] border border-gray-100">
                            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="text-sm font-bold text-gray-800">Notifications</h3>
                                {notifications.length > 0 && (
                                    <button
                                        onClick={() => markAsRead()}
                                        disabled={loading}
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center transition-colors"
                                    >
                                        <Check className="w-3 h-3 mr-1" /> Mark all read
                                    </button>
                                )}
                            </div>

                            <div className="max-h-[22rem] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-gray-400 font-medium">
                                        No new notifications.
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-gray-50">
                                        {notifications.map((notif) => (
                                            <li
                                                key={notif._id}
                                                className={`p-4 hover:bg-gray-50/80 transition-colors group ${notif.link ? 'cursor-pointer' : ''}`}
                                                onClick={() => notif.link ? handleNotificationClick(notif) : null}
                                            >
                                                <div className="flex justify-between items-start mb-1.5">
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${notif.type === 'Lead' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                        notif.type === 'Meeting' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                                            'bg-gray-100 text-gray-600 border border-gray-200'
                                                        }`}>
                                                        {notif.type}
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{notif.title}</p>
                                                <p className="text-xs font-medium text-gray-500 line-clamp-2 leading-relaxed">{notif.message}</p>

                                                {!notif.link && (
                                                    <div className="mt-2.5 flex justify-end">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                markAsRead(notif._id);
                                                            }}
                                                            className="text-[10px] font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-wider"
                                                        >
                                                            Mark read
                                                        </button>
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
