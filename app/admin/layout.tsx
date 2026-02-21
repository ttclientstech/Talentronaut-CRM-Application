import AdminSidebar from '@/components/AdminSidebar';
import NotificationBell from '@/components/NotificationBell';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto relative flex flex-col">
                <NotificationBell />
                <div className="flex-1 p-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
