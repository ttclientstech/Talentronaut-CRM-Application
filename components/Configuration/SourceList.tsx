'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';

interface Source {
    _id: string;
    name: string;
    type?: string;
}

interface Props {
    campaignId: string;
}

export default function SourceList({ campaignId }: Props) {
    const [sources, setSources] = useState<Source[]>([]);
    const [loading, setLoading] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemType, setNewItemType] = useState('Generic');
    const [creating, setCreating] = useState(false);

    const fetchSources = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/sources?campaignId=${campaignId}`);
            const data = await res.json();
            if (data.sources) setSources(data.sources);
        } catch (error) {
            console.error('Failed to fetch sources', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (campaignId) fetchSources();
        else setSources([]);
    }, [campaignId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        setCreating(true);
        try {
            const res = await fetch('/api/sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newItemName, type: newItemType, campaignId }),
            });

            if (res.ok) {
                setNewItemName('');
                fetchSources();
            }
        } catch (error) {
            console.error('Failed to create source', error);
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            const res = await fetch(`/api/sources/${id}`, { method: 'DELETE' });
            if (res.ok) fetchSources();
        } catch (error) {
            console.error('Failed to delete source', error);
        }
    };

    return (
        <div className="flex flex-col h-[500px]">
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loading ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400" /></div>
                ) : sources.length === 0 ? (
                    <div className="text-center p-4 text-sm text-gray-500">No sources found.</div>
                ) : (
                    sources.map((source) => (
                        <div
                            key={source._id}
                            className="group flex items-center justify-between rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            <div className="flex flex-col">
                                <span className="font-medium">{source.name}</span>
                                <span className="text-xs text-gray-500">{source.type}</span>
                            </div>
                            <button
                                onClick={() => handleDelete(source._id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-opacity"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div className="border-t p-4 bg-gray-50 rounded-b-lg space-y-2">
                <form onSubmit={handleCreate} className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="New Source..."
                            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <select
                            value={newItemType}
                            onChange={(e) => setNewItemType(e.target.value)}
                            className="w-24 rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-primary focus:outline-none"
                        >
                            <option value="Generic">Generic</option>
                            <option value="Facebook">FB</option>
                            <option value="Google">Google</option>
                            <option value="LinkedIn">LinkedIn</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={creating || !newItemName.trim()}
                        className="w-full flex justify-center items-center rounded-md bg-primary p-2 text-white hover:bg-primary/90 disabled:opacity-50"
                    >
                        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" /> Add Source</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
