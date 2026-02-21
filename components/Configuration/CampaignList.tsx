'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Check } from 'lucide-react';

interface Campaign {
    _id: string;
    name: string;
}

interface Props {
    domainId: string;
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export default function CampaignList({ domainId, selectedId, onSelect }: Props) {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [creating, setCreating] = useState(false);

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/campaigns?domainId=${domainId}`);
            const data = await res.json();
            if (data.campaigns) setCampaigns(data.campaigns);
        } catch (error) {
            console.error('Failed to fetch campaigns', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (domainId) fetchCampaigns();
        else setCampaigns([]);
    }, [domainId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        setCreating(true);
        try {
            const res = await fetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newItemName, domainId }),
            });

            if (res.ok) {
                setNewItemName('');
                fetchCampaigns();
            }
        } catch (error) {
            console.error('Failed to create campaign', error);
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure? This will delete all associated Sources.')) return;

        try {
            const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
            if (res.ok) {
                if (selectedId === id) onSelect('');
                fetchCampaigns();
            }
        } catch (error) {
            console.error('Failed to delete campaign', error);
        }
    };

    return (
        <div className="flex flex-col h-[500px]">
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loading ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400" /></div>
                ) : campaigns.length === 0 ? (
                    <div className="text-center p-4 text-sm text-gray-500">No campaigns found.</div>
                ) : (
                    campaigns.map((campaign) => (
                        <div
                            key={campaign._id}
                            onClick={() => onSelect(campaign._id)}
                            className={`group flex items-center justify-between rounded-md px-3 py-2 text-sm cursor-pointer transition-colors ${selectedId === campaign._id
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <span>{campaign.name}</span>
                            <div className="flex items-center gap-2">
                                {selectedId === campaign._id && <Check className="h-4 w-4" />}
                                <button
                                    onClick={(e) => handleDelete(e, campaign._id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-opacity"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="border-t p-4 bg-gray-50 rounded-b-lg">
                <form onSubmit={handleCreate} className="flex gap-2">
                    <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="New Campaign..."
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
