"use client";

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Activity, Search, Filter } from 'lucide-react';
import { fetchAPI } from '@/lib/api';

interface Earthquake {
    location: string;
    magnitude: number;
    depth: number;
    time: string;
    source: string;
}

export default function HistoryPage() {
    const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [yearFilter, setYearFilter] = useState<string>('');
    const [activeYear, setActiveYear] = useState<string>('');
    const [onlyPerceptible, setOnlyPerceptible] = useState(false);

    const loadData = async (year: string, perceptible: boolean) => {
        setIsLoading(true);
        try {
            let url = '/earthquakes?limit=200'; // Tomar hasta 200 elementos para visualizar
            if (year) {
                url += `&year=${year}`;
            }
            if (perceptible) {
                url += `&min_mag=3.0`;
            }
            const data = await fetchAPI(url);
            setEarthquakes(data);
            setActiveYear(year);
        } catch (error) {
            console.error("Failed to fetch historical data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData('', onlyPerceptible); // Cargar más recientes por defecto (combinando años)
    }, [onlyPerceptible]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadData(yearFilter, onlyPerceptible);
    };

    return (
        <main className="min-h-screen pt-24 px-6 pb-12 bg-slate-50/50 relative">
            {/* Elementos de fondo */}
            <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4 shadow-inner">
                        <Activity size={32} />
                    </div>
                    <h1 className="text-4xl font-bold mb-4 text-slate-800">Archivo <span className="text-gradient">Sísmico</span></h1>
                    <p className="text-slate-500 max-w-2xl mx-auto">
                        Explora la historia sísmica detallada de Cuba. Datos oficiales extraídos del CENAIS.
                    </p>
                </div>

                {/* Filtros */}
                <div className="flex justify-center mb-12">
                    <form onSubmit={handleSearch} className="flex flex-col gap-4 max-w-md w-full">
                        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                            <div className="flex-1 flex items-center gap-2 pl-4 text-slate-400">
                                <Calendar size={20} />
                                <input
                                    type="number"
                                    placeholder="Ej: 2024, 1990..."
                                    value={yearFilter}
                                    onChange={(e) => setYearFilter(e.target.value)}
                                    className="w-full bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400 py-2"
                                    min="1950"
                                    max={new Date().getFullYear()}
                                />
                            </div>
                            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-emerald-500/30 flex items-center gap-2">
                                <Search size={18} />
                                <span>Filtrar</span>
                            </button>
                            {activeYear && (
                                <button type="button" onClick={() => { setYearFilter(''); loadData('', onlyPerceptible); }} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-3 rounded-xl font-medium transition-colors">
                                    Limpiar
                                </button>
                            )}
                        </div>

                        <label className="flex items-center gap-3 self-center cursor-pointer text-slate-600 bg-white/60 px-5 py-2.5 rounded-full border border-slate-200 hover:bg-white transition-colors">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={onlyPerceptible}
                                    onChange={(e) => setOnlyPerceptible(e.target.checked)}
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 checked:border-emerald-500 checked:bg-emerald-500 transition-all"
                                />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none opacity-0 peer-checked:opacity-100">
                                    <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5"><path d="M3 8L6 11L11 3.5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"></path></svg>
                                </div>
                            </div>
                            <span className="font-medium text-sm">Mostrar solo sismos perceptibles (Mag ≥ 3.0)</span>
                        </label>
                    </form>
                </div>

                {/* Resultados */}
                <div className="mb-6 flex justify-between items-end border-b border-slate-200 pb-2">
                    <h3 className="font-bold text-slate-700 text-xl flex items-center gap-2">
                        <Filter size={20} className="text-emerald-500" />
                        {activeYear ? `Eventos en ${activeYear}` : `Últimos eventos registrados`}
                    </h3>
                    <span className="text-slate-500 text-sm font-medium">{earthquakes.length} resultados</span>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(n => (
                            <div key={n} className="bg-white/60 h-40 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : earthquakes.length === 0 ? (
                    <div className="text-center py-20 bg-white/50 rounded-3xl border border-slate-200 border-dashed">
                        <div className="inline-flex w-16 h-16 bg-slate-100 rounded-full items-center justify-center text-slate-400 mb-4">
                            <Search size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">No se encontraron sismos</h3>
                        <p className="text-slate-500">Intenta buscar con otro año o recarga la página.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {earthquakes.map((eq, i) => {
                            const dateStr = new Date(eq.time).toLocaleString('es-ES', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            });
                            const isSevere = eq.magnitude >= 5.0;

                            return (
                                <div key={i} className="bg-white hover:bg-slate-50 border border-slate-100 p-6 rounded-2xl flex flex-col gap-4 shadow-xl shadow-slate-200/20 transition-all hover:-translate-y-1">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                            <Calendar size={16} />
                                            <span className="font-semibold text-sm">{dateStr}</span>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm ${isSevere ? 'bg-red-500 text-white shadow-red-500/40' : 'bg-orange-100 text-orange-600 border border-orange-200'}`}>
                                            Mag: {eq.magnitude.toFixed(1)}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 mt-2 text-slate-700">
                                        <div className="p-2 bg-slate-100 rounded-full shrink-0">
                                            <MapPin size={18} className="text-slate-500" />
                                        </div>
                                        <span className="font-bold text-lg">{eq.location}</span>
                                    </div>

                                    <div className="flex items-center gap-6 mt-1 text-slate-500 text-sm pl-11">
                                        <div className="flex items-center gap-1.5">
                                            <Activity size={16} className="text-emerald-500" />
                                            <span>Profundidad: <b>{eq.depth.toFixed(1)} km</b></span>
                                        </div>
                                    </div>

                                    <p className="mt-2 text-xs text-slate-400 text-right">Fuente: {eq.source}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
