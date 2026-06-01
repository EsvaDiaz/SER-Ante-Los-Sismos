"use client";

import { Users, FileText, AlertTriangle, TrendingUp, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
    return (
        <main className="px-6 pb-12">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>
                        <p className="text-slate-400">Control General del Sistema</p>
                    </div>
                    <div className="space-x-4">
                        <Link href="/admin/posts/new" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition shadow-lg shadow-blue-500/20">
                            Crear Publicación
                        </Link>
                    </div>
                </header>

                {/* Estadísticas de Admin */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: "Usuarios Totales", value: "1,234", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
                        { label: "Reportes Hoy", value: "5", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
                        { label: "Publicaciones", value: "45", icon: FileText, color: "text-purple-400", bg: "bg-purple-500/10" },
                        { label: "Interacciones IA", value: "892", icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/10" },
                    ].map((stat, i) => (
                        <div key={i} className="glass-panel p-6 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
                                <p className="text-3xl font-bold text-white">{stat.value}</p>
                            </div>
                            <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Links Rápidos y Actividad Reciente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="glass-panel p-6 rounded-xl">
                        <h3 className="text-xl font-bold text-white mb-4">Acciones Rápidas</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Link href="/admin/posts" className="p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-white/5 transition text-center group">
                                <FileText className="mx-auto mb-2 text-blue-400 group-hover:scale-110 transition" size={24} />
                                <span className="text-white text-sm">Noticias</span>
                            </Link>
                            <Link href="/admin/comments" className="p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-white/5 transition text-center group">
                                <MessageCircle className="mx-auto mb-2 text-emerald-400 group-hover:scale-110 transition" size={24} />
                                <span className="text-white text-sm">Comentarios</span>
                            </Link>
                            <Link href="/admin/users" className="p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-white/5 transition text-center group">
                                <Users className="mx-auto mb-2 text-purple-400 group-hover:scale-110 transition" size={24} />
                                <span className="text-white text-sm">Usuarios</span>
                            </Link>
                            <Link href="/admin/analytics" className="p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-white/5 transition text-center group">
                                <TrendingUp className="mx-auto mb-2 text-green-400 group-hover:scale-110 transition" size={24} />
                                <span className="text-white text-sm">Analíticas</span>
                            </Link>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-xl">
                        <h3 className="text-xl font-bold text-white mb-4">Actividad Reciente</h3>
                        <div className="space-y-4">
                            {[
                                "Nuevo usuario registrado: Carlos M.",
                                "Alerta sísmica detectada (3.2 Granma)",
                                "Publicación creada: 'Medidas de seguridad'",
                                "Usuario reportó un error en el bot"
                            ].map((activity, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
                                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                    <p className="text-slate-300 text-sm">{activity}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
