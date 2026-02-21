import SalesSidebar from '@/components/SalesSidebar';

export default function SalesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <SalesSidebar />
            <main className="flex-1 overflow-y-auto p-10">
                {children}
            </main>
        </div>
    );
}
