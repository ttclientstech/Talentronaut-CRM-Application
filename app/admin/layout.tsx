import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto p-10">
                {children}
            </main>
        </div>
    );
}
