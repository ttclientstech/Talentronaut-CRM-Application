'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Check } from 'lucide-react';

interface Domain {
    _id: string;
    name: string;
}

interface Props {
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export default function DomainList({ selectedId, onSelect }: Props) {
    const [domains, setDomains] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItemName, setNewItemName] = useState('');
    const [creating, setCreating] = useState(false);

    const fetchDomains = async () => {
        try {
            const res = await fetch('/api/domains');
            const data = await res.json();
            if (data.domains) setDomains(data.domains);
        } catch (error) {
            console.error('Failed to fetch domains', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDomains();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        setCreating(true);
        try {
            const res = await fetch('/api/domains', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newItemName }),
            });

            if (res.ok) {
                setNewItemName('');
                fetchDomains();
            }
        } catch (error) {
            console.error('Failed to create domain', error);
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure? This will delete all associated Campaigns and Sources.')) return;

        try {
            const res = await fetch(`/api/domains/${id}`, { method: 'DELETE' });
            if (res.ok) {
                if (selectedId === id) onSelect(''); // Deselect if deleted
                fetchDomains();
            }
        } catch (error) {
            console.error('Failed to delete domain', error);
        }
    };

    return (
        <div className="flex flex-col h-[500px]">
            {/* List Area */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loading ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400" /></div>
                ) : domains.length === 0 ? (
                    <div className="text-center p-4 text-sm text-gray-500">No domains yet.</div>
                ) : (
                    domains.map((domain) => (
                        <div
                            key={domain._id}
                            onClick={() => onSelect(domain._id)}
                            className={`group flex items-center justify-between rounded-md px-3 py-2 text-sm cursor-pointer transition-colors ${selectedId === domain._id
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <span>{domain.name}</span>
                            <div className="flex items-center gap-2">
                                {selectedId === domain._id && <Check className="h-4 w-4" />}
                                <button
                                    onClick={(e) => handleDelete(e, domain._id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-opacity"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Area */}
            <div className="border-t p-4 bg-gray-50 rounded-b-lg">
                <form onSubmit={handleCreate} className="flex gap-2">
                    <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="New Domain..."
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                        type="submit"
                        disabled={creating || !newItemName.trim()}
                        className="rounded-md bg-primary p-2 text-white hover:bg-primary/90 disabled:opacity-50"
                    >
                        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </button>
                </form>
            </div>
        </div>
    );
}
