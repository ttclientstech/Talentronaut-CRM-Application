'use client';

import { Folder, MoreVertical, Edit2, Trash2 } from 'lucide-react';

interface FolderCardProps {
    name: string;
    description?: string;
    count?: number;
    onClick: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

export default function FolderCard({
    name,
    description,
    count,
    onClick,
    onEdit,
    onDelete,
}: FolderCardProps) {
    return (
        <div
            onClick={onClick}
            className="group relative flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md cursor-pointer"
        >
            <div className="flex items-start justify-between mb-8">
                <div className="rounded-xl bg-primary/5 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Folder className="h-6 w-6" />
                </div>
                <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    {onEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit();
                            }}
                            className="p-1 text-gray-400 hover:text-primary"
                        >
                            <Edit2 className="h-4 w-4" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            className="p-1 text-gray-400 hover:text-red-500"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-auto">
                <h3 className="font-brand text-xl font-bold text-foreground line-clamp-1 mb-1">
                    {name}
                </h3>
                {description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {description}
                    </p>
                )}
            </div>

            {count !== undefined && (
                <div className="mt-6 flex items-center justify-between border-t pt-4">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Contents
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-foreground">
                        {count}
                    </span>
                </div>
            )}
        </div>
    );
}
