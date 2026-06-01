"use client";

import { useState, useEffect } from 'react';
import { Newspaper, Bell, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';

interface Post {
    title: string;
    content: string;
    type: string;
    created_at: string;
    tags?: string[];
}

export default function NewsSection() {
    const [feed, setFeed] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadFeed = async () => {
            try {
                const [postsRes, eqsRes] = await Promise.all([
                    fetchAPI('/posts?limit=5'),
                    fetchAPI('/earthquakes?limit=5')
                ]);

                // Combinar y nombrar
                const merged = [
                    ...postsRes.map((p: any) => ({ ...p, _feedType: 'post' })),
                    ...eqsRes.map((eq: any) => ({ ...eq, _feedType: 'earthquake' }))
                ];

                // Sortear por fecha descendente
                merged.sort((a, b) => {
                    const dateA = new Date(a.time || a.created_at).getTime();
                    const dateB = new Date(b.time || b.created_at).getTime();
                    return dateB - dateA;
                });

                // Tomar los 5 primeros
                setFeed(merged.slice(0, 5));
            } catch (error) {
                console.error("Failed to fetch feed:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadFeed();
    }, []);

    if (isLoading) return <div className="text-center py-10">Cargando actualizaciones...</div>;
    if (feed.length === 0) return null;

    return (
        <section className="py-20 px-6">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold mb-10 flex items-center justify-center gap-3">
                    <Bell className="text-blue-400" />
                    <span className="text-gradient">Últimas Alertas y Sismos</span>
                </h2>

                <div className="flex flex-col gap-4 max-w-3xl mx-auto">
                    {feed.map((item, i) => {
                        const isEq = item._feedType === 'earthquake';
                        const date = new Date(isEq ? item.time : item.created_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                        const timeValue = isEq ? new Date(item.time).getTime() : new Date(item.created_at).getTime();

                        return (
                            <Link key={i} href={`/alertas?time=${timeValue}`} className="block">
                                <div className={`glass-panel p-6 rounded-2xl transition duration-300 flex items-center gap-6 border-l-4 cursor-pointer ${isEq ? 'border-orange-500 hover:bg-orange-500/5 hover:scale-[1.01]' :
                                    item.type === 'alert' ? 'border-red-500 hover:bg-red-500/5 hover:scale-[1.01]' :
                                        'border-blue-500 hover:bg-blue-500/5 hover:scale-[1.01]'
                                    }`}>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${isEq ? 'bg-orange-500/20 text-orange-400' :
                                                item.type === 'alert' ? 'bg-red-500/20 text-red-500' :
                                                    item.type === 'educational' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {isEq ? 'SISMO REGISTRADO' : item.type}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {date}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold mb-1 text-white">
                                            {isEq ? `📍 ${item.location}` : item.title}
                                        </h3>

                                        <p className="text-slate-400 text-sm mt-1">
                                            {isEq ? `Magnitud: ${item.magnitude} | Profundidad: ${item.depth}km` : (item.content.length > 150 ? item.content.substring(0, 150) + '...' : item.content)}
                                        </p>
                                        {!isEq && item.video_url && (
                                            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg text-xs font-semibold text-white">
                                                <span>🎬</span> Video Adjunto
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
