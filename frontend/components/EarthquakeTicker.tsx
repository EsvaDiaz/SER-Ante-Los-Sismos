"use client";

import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

interface Earthquake {
    id: string;      // Nota: El ID del Modelo puede ser string
    location: string;
    magnitude: number;
    time: string;
}

export default function EarthquakeTicker() {
    const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);

    useEffect(() => {
        const fetchEarthquakes = async () => {
            try {
                // Cambio de URL basado en el estándar de implementación `fetchAPI`
                const response = await fetch('http://localhost:8000/earthquakes');
                if (response.ok) {
                    const data = await response.json();

                    if (data && data.length > 0) {
                        const formattedData = data.map((eq: any, index: number) => ({
                            id: eq._id || eq.id || String(index),
                            location: eq.location,
                            magnitude: eq.magnitude || 0.0,
                            time: new Date(eq.time).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        }));
                        setEarthquakes(formattedData);
                        return;
                    }
                }
            } catch (error) {
                console.error("Failed to fetch earthquakes limit:", error);
            }
            // Fallback mock data
            const mockData = [
                { id: "1", location: "Pilón, Granma", magnitude: 3.2, time: "Hace 20 min" },
                { id: "2", location: "Santiago de Cuba", magnitude: 2.8, time: "Hace 1 hora" },
                { id: "3", location: "Guantánamo", magnitude: 4.1, time: "Hace 5 horas" },
            ];
            setEarthquakes(mockData);
        };

        fetchEarthquakes();
    }, []);

    return (
        <div className="w-full bg-white/50 border-y border-slate-200 overflow-hidden py-2 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 flex items-center gap-4">
                <div className="flex items-center gap-2 text-emerald-600 font-bold whitespace-nowrap">
                    <Activity className="w-4 h-4 animate-pulse" />
                    <span>ÚLTIMOS SISMOS:</span>
                </div>
                <div className="flex-1 overflow-hidden relative h-6">
                    {/* Animación simple de scroll */}
                    <div className="absolute whitespace-nowrap animate-[scroll_15s_linear_infinite] flex gap-8">
                        {[...earthquakes, ...earthquakes].map((eq, i) => ( // Duplicate for infinite scroll
                            <span key={`${eq.id}-${i}`} className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <span className={`font-bold ${eq.magnitude >= 4 ? 'text-red-500' : 'text-emerald-600'}`}>
                                    {eq.magnitude.toFixed(1)}
                                </span>
                                <span>{eq.location}</span>
                                <span className="text-slate-500 text-xs">({eq.time})</span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
