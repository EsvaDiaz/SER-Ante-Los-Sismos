import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-950 flex">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Área de Contenido Principal */}
            <div className="flex-1 ml-64 flex flex-col min-h-screen overflow-x-hidden pt-6">
                {children}
            </div>
        </div>
    );
}
