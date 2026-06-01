"use client";

export default function AdminAnalytics() {
    return (
        <main className="px-6 pb-12">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-8">Análisis de Datos</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Chart 1: Interacciones Diarias */}
                    <div className="glass-panel p-6 rounded-xl">
                        <h3 className="text-xl font-bold mb-6 text-white">Interacciones Diarias (7 Días)</h3>
                        <div className="h-64 flex items-end justify-between px-4 pb-4 border-b border-white/5">
                            {[45, 60, 30, 80, 50, 90, 70].map((h, i) => (
                                <div key={i} className="group relative w-full mx-1">
                                    <div
                                        style={{ height: `${h}%` }}
                                        className="bg-blue-600 rounded-t-lg transition-all duration-500 hover:bg-blue-500"
                                    ></div>
                                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-500">D{i + 1}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chart 2: Distribución de Usuario */}
                    <div className="glass-panel p-6 rounded-xl">
                        <h3 className="text-xl font-bold mb-6 text-white">Usuarios por Provincia</h3>
                        <div className="space-y-4">
                            {[
                                { label: "Santiago de Cuba", pct: 60, color: "bg-purple-600" },
                                { label: "Granma", pct: 25, color: "bg-blue-600" },
                                { label: "Guantánamo", pct: 15, color: "bg-cyan-600" },
                            ].map((item, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1 text-slate-300">
                                        <span>{item.label}</span>
                                        <span>{item.pct}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div style={{ width: `${item.pct}%` }} className={`h-full ${item.color} rounded-full`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
