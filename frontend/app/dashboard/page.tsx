"use client";

import { useState } from 'react';
import { Activity, MessageSquare, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

    return (
        <main className="min-h-screen pt-24 px-6 pb-12 bg-slate-50">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Panel de Actividad</h1>
                        <p className="text-slate-500">Revisa tu historial y estado de alertas</p>
                    </div>
                    <Link href="/chat" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-500/20">
                        Nueva Consulta IA
                    </Link>
                </header>

                {/* Grid de Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex items-center gap-4">
                        <div className="p-3 bg-red-50 text-red-500 rounded-xl">
                            <AlertTriangle size={28} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-semibold">Alertas Cercanas</p>
                            <p className="text-2xl font-bold text-slate-800">0</p>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
                            <MessageSquare size={28} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-semibold">Consultas IA</p>
                            <p className="text-2xl font-bold text-slate-800">12</p>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
                            <Activity size={28} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-semibold">Nivel de Riesgo</p>
                            <p className="text-2xl font-bold text-emerald-500">Bajo</p>
                        </div>
                    </div>
                </div>

                {/* Tablas de Contenido */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden min-h-[400px]">
                    <div className="flex border-b border-slate-100 bg-slate-50">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-8 py-5 text-sm font-bold transition ${activeTab === 'overview' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Resumen de Actividad
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-8 py-5 text-sm font-bold transition ${activeTab === 'history' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Historial de Consultas
                        </button>
                    </div>

                    <div className="p-8">
                        {activeTab === 'overview' ? (
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg text-slate-800 mb-6">Últimas Interacciones</h3>
                                {/* Mock Data */}
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center">
                                                <MessageSquare size={18} />
                                            </div>
                                            <p className="text-slate-700 font-medium">Consultaste sobre "Medidas ante sismos"</p>
                                        </div>
                                        <span className="text-sm font-semibold text-slate-400">Hace {i} días</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-slate-500">
                                <p>Historial completo próximamente...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
