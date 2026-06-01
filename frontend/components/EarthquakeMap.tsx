"use client";

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

interface EarthquakeMapProps {
    earthquakes: any[];
    selectedEq?: any;
}

export default function EarthquakeMap({ earthquakes, selectedEq }: EarthquakeMapProps) {
    const mapRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && containerRef.current && !mapRef.current) {
            const L = require('leaflet');
            // Mapa inicial y da las coordenadas iniciales de Cuba
            const map = L.map(containerRef.current).setView([21.5, -79.0], 6);

            // Estilo ligero de mapa
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CartoDB',
            }).addTo(map);

            mapRef.current = map;
        }

        if (mapRef.current) {
            const L = require('leaflet');
            const map = mapRef.current;

            // Limpia marcadores existentes de renderizados anteriores
            map.eachLayer((layer: any) => {
                if (layer instanceof L.CircleMarker) {
                    map.removeLayer(layer);
                }
            });

            // Dibuja nuevos marcadores por color
            earthquakes.forEach((eq: any) => {
                if (!eq.coordinates || eq.coordinates.length < 2) return;

                let color = '#10b981'; // emerald (< 3.0)
                if (eq.magnitude >= 3.0) color = '#f59e0b'; // amber
                if (eq.magnitude >= 4.5) color = '#f97316'; // orange
                if (eq.magnitude >= 6.0) color = '#ef4444'; // red

                L.circleMarker([eq.coordinates[0], eq.coordinates[1]], {
                    radius: Math.max(6, Math.pow(1.5, eq.magnitude)),
                    fillColor: color,
                    color: '#ffffff',
                    weight: 1.5,
                    opacity: 1,
                    fillOpacity: 0.8
                }).bindPopup(`
                    <div style="font-family: inherit; margin: 0;">
                        <h4 style="margin:0 0 4px 0; font-weight:bold; color:#1e293b;">${eq.location}</h4>
                        <p style="margin:0; font-size:13px; color:#64748b;">
                            <b>Magnitud:</b> ${eq.magnitude}<br/>
                            <b>Profundidad:</b> ${eq.depth} km<br/>
                        </p>
                    </div>
                `).addTo(map);
            });

            // Va a la selección si es solicitado
            // Integrar zoom al seleccionar, se mantiene demasiado lejos
            if (selectedEq && selectedEq._feedType === 'earthquake' && selectedEq.coordinates && selectedEq.coordinates.length >= 2) {
                map.flyTo([selectedEq.coordinates[0], selectedEq.coordinates[1]], 8, { animate: true, duration: 1.0 });
            }
        }
    }, [earthquakes, selectedEq]);

    return (
        <div className="w-full h-full relative z-0">
            <div ref={containerRef} className="absolute inset-0" />
        </div>
    );
}
