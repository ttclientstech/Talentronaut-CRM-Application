'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, ChevronDown, Folder, Plus, Loader2, Trash2 } from 'lucide-react';

interface TreeItem {
    id: string;
    name: string;
    type: 'project' | 'domain' | 'subdomain' | 'campaign' | 'lead';
    children?: TreeItem[];
    isOpen?: boolean;
    isLoading?: boolean;
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [treeData, setTreeData] = useState<TreeItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/projects');
            const data = await res.json();
            const projects = data.projects.map((p: any) => ({
                id: p._id,
                name: p.name,
                type: 'project' as const,
                children: [],
                isOpen: false,
                isLoading: false
            }));
            setTreeData(projects);
        } catch (error) {
            console.error('Failed to fetch projects', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const toggleFolder = async (item: TreeItem, path: number[]) => {
        const newData = [...treeData];
        let currentLevel = newData;
        for (let i = 0; i < path.length - 1; i++) {
            currentLevel = currentLevel[path[i]].children!;
        }
        const targetItem = currentLevel[path[path.length - 1]];

        targetItem.isOpen = !targetItem.isOpen;

        if (targetItem.isOpen && (!targetItem.children || targetItem.children.length === 0)) {
            targetItem.isLoading = true;
            setTreeData([...newData]);

            try {
                let url = '';
                if (targetItem.type === 'project') url = `/api/domains?projectId=${targetItem.id}`;
                else if (targetItem.type === 'domain') url = `/api/subdomains?domainId=${targetItem.id}`;
                else if (targetItem.type === 'subdomain') url = `/api/campaigns?subdomainId=${targetItem.id}`;
                else if (targetItem.type === 'campaign') url = `/api/leads?campaignId=${targetItem.id}`; // Bypass sources

                if (url) {
                    const res = await fetch(url);
                    const data = await res.json();

                    let childItems = [];
                    let nextType: 'domain' | 'subdomain' | 'campaign' | 'lead' = 'domain';

                    if (targetItem.type === 'project') {
                        childItems = data.domains || [];
                        nextType = 'domain';
                    } else if (targetItem.type === 'domain') {
                        childItems = data.subdomains || [];
                        nextType = 'subdomain';
                    } else if (targetItem.type === 'subdomain') {
                        childItems = data.campaigns || [];
                        nextType = 'campaign';
                    } else if (targetItem.type === 'campaign') {
                        childItems = data.leads || [];
                        nextType = 'lead';
                    }

                    const children = childItems.map((c: any) => ({
                        id: c._id,
                        name: nextType === 'lead' ? `${c.firstName} ${c.lastName}` : c.name,
                        type: nextType,
                        children: targetItem.type === 'campaign' ? undefined : [], // Leaves have no children
                        isOpen: false,
                        isLoading: false
                    }));
                    targetItem.children = children;
                }
            } catch (error) {
                console.error('Failed to fetch children', error);
            } finally {
                targetItem.isLoading = false;
            }
        }

        setTreeData([...newData]);
    };

    const handleSelect = (item: TreeItem) => {
        // We can navigate to a specific page or push query params
        // For now, let's just push query params to the main configuration page
        router.push(`/admin/configuration?type=${item.type}&id=${item.id}&name=${encodeURIComponent(item.name)}`);
    };

    const handleDelete = async (e: React.MouseEvent, item: TreeItem, path: number[]) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to delete this ${item.type}?`)) return;

        setDeletingId(item.id);
        try {
            let url = '';
            if (item.type === 'project') url = `/api/projects/${item.id}`;
            else if (item.type === 'domain') url = `/api/domains/${item.id}`;
            else if (item.type === 'subdomain') url = `/api/subdomains/${item.id}`;
            else if (item.type === 'campaign') url = `/api/campaigns/${item.id}`;
            else if (item.type === 'lead') url = `/api/leads/${item.id}`;

            const res = await fetch(url, { method: 'DELETE' });
            if (res.ok) {
                // Remove from local state
                if (path.length === 1) {
                    // It's a root project
                    setTreeData(prev => prev.filter((_, i) => i !== path[0]));
                } else {
                    const newData = [...treeData];
                    let parentLevel = newData;
                    for (let i = 0; i < path.length - 2; i++) {
                        parentLevel = parentLevel[path[i]].children!;
                    }
                    const parent = parentLevel[path[path.length - 2]];
                    if (parent && parent.children) {
                        parent.children = parent.children.filter((_, i) => i !== path[path.length - 1]);
                    }
                    setTreeData(newData);
                }

                // If currently viewing this item, redirect to parent or root
                if (pathname.includes(item.id) || (typeof window !== 'undefined' && window.location.search.includes(item.id))) {
                    router.push('/admin/configuration');
                }
            } else {
                alert('Failed to delete item.');
            }
        } catch (error) {
            console.error('Failed to delete', error);
            alert('An error occurred during deletion.');
        } finally {
            setDeletingId(null);
        }
    };

    const renderTree = (items: TreeItem[], path: number[] = [], depth = 0) => {
        return items.map((item, index) => {
            const currentPath = [...path, index];
            const isSelected = pathname.includes(item.id) || (typeof window !== 'undefined' && window.location.search.includes(item.id));

            return (
                <div key={item.id} className="select-none">
                    <div
                        className={`group flex items-center py-1.5 px-2 cursor-pointer hover:bg-gray-100/80 rounded-md transition-colors ${isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
                            }`}
                        style={{ paddingLeft: `${depth * 12 + 8}px` }}
                        onClick={() => handleSelect(item)}
                    >
                        {item.type !== 'lead' ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFolder(item, currentPath);
                                }}
                                className="p-0.5 hover:bg-gray-200 rounded shrink-0 mr-1 text-gray-500"
                            >
                                {item.isOpen ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </button>
                        ) : (
                            <span className="w-5 mr-1 shrink-0" /> // Spacer for alignment
                        )}
                        <Folder className={`h-4 w-4 mr-2 shrink-0 ${isSelected ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'}`} />
                        <span className="truncate text-sm flex-1">{item.name}</span>
                        {deletingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-red-400 shrink-0 ml-2" />
                        ) : (
                            <button
                                onClick={(e) => handleDelete(e, item, currentPath)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 hover:text-red-500 rounded text-gray-400 transition-all shrink-0 ml-2"
                                title={`Delete ${item.type}`}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {item.isOpen && item.isLoading && (
                        <div className="flex items-center py-1 text-gray-400" style={{ paddingLeft: `${(depth + 1) * 12 + 32}px` }}>
                            <Loader2 className="h-3 w-3 animate-spin mr-2" />
                            <span className="text-xs">Loading...</span>
                        </div>
                    )}

                    {item.isOpen && item.children && item.children.length > 0 && (
                        <div className="mt-0.5">
                            {renderTree(item.children, currentPath, depth + 1)}
                        </div>
                    )}

                    {item.isOpen && !item.isLoading && item.children?.length === 0 && (
                        <div className="py-1 text-xs text-gray-400 italic" style={{ paddingLeft: `${(depth + 1) * 12 + 32}px` }}>
                            Empty folder
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] gap-6">
            {/* Explorer Secondary Sidebar */}
            <div className="w-64 shrink-0 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="font-bold text-gray-900 tracking-tight text-sm uppercase">Explorer</h2>
                    <button onClick={() => router.push('/admin/configuration?action=new-project')} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-500" title="New Project">
                        <Plus className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-32">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                        </div>
                    ) : treeData.length === 0 ? (
                        <div className="text-center p-4 text-sm text-gray-500">
                            No projects found. Create one to get started.
                        </div>
                    ) : (
                        renderTree(treeData)
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                {children}
            </div>
        </div>
    );
}
