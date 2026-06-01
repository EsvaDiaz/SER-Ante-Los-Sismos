"use client";

import { useState, useEffect } from 'react';
import { Bell, Search } from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import dynamic from 'next/dynamic';

const EarthquakeMap = dynamic(() => import('@/components/EarthquakeMap'), { ssr: false });

export default function AlertasPage() {
    const [feed, setFeed] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    const [mapYear, setMapYear] = useState('');
    const [mapLimit, setMapLimit] = useState<number | string>(50);
    const [loadingMap, setLoadingMap] = useState(false);

    const loadData = async (year: string, limitVal: number | string, isInitial = false) => {
        const limit = Number(limitVal);
        if (isNaN(limit) || limit <= 0 || limit > 1000) {
            alert("Por favor introduce una cantidad válida (1 - 1000)");
            return;
        }

        if (!isInitial) setLoadingMap(true);
        try {
            let eqUrl = `/earthquakes?limit=${limit}`;
            if (year) eqUrl += `&year=${year}`;
            
            const eqsRes = await fetchAPI(eqUrl);

            const merged = eqsRes.map((eq: any) => ({ ...eq, _feedType: 'earthquake' }));

            merged.sort((a: any, b: any) => {
                const dateA = new Date(a.time).getTime();
                const dateB = new Date(b.time).getTime();
                return dateB - dateA;
            });

            setFeed(merged);

            let targetItem = null;
            if (isInitial) {
                const searchParams = new URLSearchParams(window.location.search);
                const targetTime = searchParams.get('time');
                if (targetTime) {
                    targetItem = merged.find((m: any) => {
                        const mTime = new Date(m.time).getTime().toString();
                        return mTime === targetTime;
                    });
                }
            } else if (selectedItem) {
                targetItem = merged.find((m: any) => (m.id === selectedItem.id || m._id === selectedItem._id));
            }

            if (!targetItem && merged.length > 0) {
                targetItem = merged[0];
            }
            
            if (targetItem) {
                setSelectedItem(targetItem);
            }
        } catch (error) {
            console.error("Failed to fetch feed:", error);
        } finally {
            setIsLoading(false);
            setLoadingMap(false);
        }
    };

    useEffect(() => {
        loadData('', 50, true);
    }, []);

    const renderContent = (item: any) => {
        if (!item) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <Bell size={48} className="mb-4 opacity-50" />
                    <p>Selecciona un sismo en la lista para ver su ubicación.</p>
                </div>
            );
        }

        const lat = item.coordinates[0];
        const lon = item.coordinates[1];

        return (
            <div className="w-full h-full flex flex-col relative bg-slate-800">
                {/* Barra de Control del Mapa */}
                <div className="bg-slate-900/90 backdrop-blur-md p-3 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-center z-10 relative shadow-xl">
                    <div className="text-white font-bold flex items-center gap-2 mb-3 sm:mb-0">
                        <span>🗺️ Vista Sísmica interactiva</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <input
                            type="number"
                            placeholder="Año"
                            value={mapYear}
                            onChange={e => setMapYear(e.target.value)}
                            className="bg-slate-800 border border-slate-600 text-white px-3 py-1.5 rounded-lg w-24 outline-none focus:border-emerald-500 transition-colors"
                        />
                        <input
                            type="number"
                            placeholder="Cantidad"
                            value={mapLimit}
                            onChange={e => setMapLimit(e.target.value)}
                            min={1}
                            max={1000}
                            className="bg-slate-800 border border-slate-600 text-white px-3 py-1.5 rounded-lg w-24 outline-none focus:border-emerald-500 transition-colors"
                        />
                        <button
                            onClick={() => loadData(mapYear, mapLimit)}
                            disabled={loadingMap}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                        >
                            <Search size={14} /> Filtrar
                        </button>
                    </div>
                </div>

                <div className="flex-1 relative overflow-hidden rounded-b-2xl">
                    {loadingMap && (
                        <div className="absolute inset-0 bg-slate-800/80 z-20 flex items-center justify-center backdrop-blur-sm">
                            <span className="text-white font-bold animate-pulse">↻ Reestructurando Capas...</span>
                        </div>
                    )}
                    <EarthquakeMap earthquakes={feed} selectedEq={item} />
                </div>
            </div>
        );
    };

    if (isLoading) return <div className="text-center py-20 min-h-screen flex items-center justify-center"><div className="animate-pulse text-2xl">Cargando Historial de Sismos...</div></div>;

    return (
        <main className="min-h-screen pt-24 pb-12 px-6 flex flex-col">
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-6">

                {/* Lado Izquierdo: Lista del Feed */}
                <div className="md:w-1/3 flex flex-col h-[80vh]">
                    <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
                        <Bell className="text-orange-400" />
                        <span className="text-gradient">Alertas Sísmicas</span>
                    </h1>

                    <div className="overflow-y-auto pr-2 space-y-4 flex-1 custom-scrollbar">
                        {feed.length === 0 ? (
                            <p className="text-slate-400">No hay sismos registrados.</p>
                        ) : feed.map((item, i) => {
                            const date = new Date(item.time).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                            const isSelected = selectedItem === item;

                            return (
                                <div
                                    key={i}
                                    onClick={() => setSelectedItem(item)}
                                    className={`glass-panel p-4 rounded-xl cursor-pointer transition-all duration-300 border-l-4 border-orange-500 ${isSelected ? 'bg-slate-800/80 scale-[1.02]' : 'hover:bg-slate-800/50'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-orange-500/20 text-orange-400">
                                            SISMO
                                        </span>
                                        <span className="text-xs text-slate-500">{date}</span>
                                    </div>
                                    <h3 className="font-bold text-white text-sm mb-1 line-clamp-1">
                                        {item.location}
                                    </h3>
                                    <p className="text-xs text-orange-300">
                                        M {item.magnitude} | Prof: {item.depth}km
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Lado Derecho: Mapa Interactivo o Detalles del Contenido */}
                <div className="md:w-2/3 h-[80vh] glass-panel rounded-2xl overflow-hidden p-1">
                    {renderContent(selectedItem)}
                </div>

            </div>
        </main>
    );
}
