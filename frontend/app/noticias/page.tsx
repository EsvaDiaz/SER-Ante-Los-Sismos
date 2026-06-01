"use client";

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import PostCard from '@/components/PostCard';
import { Filter, Search, Newspaper } from 'lucide-react';

export default function NoticiasPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        setLoading(true);
        try {
            const data = await fetchAPI('/posts?limit=100');
            setPosts(data);
        } catch (error) {
            console.error("Error loading posts:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPosts = posts.filter(post => {
        const matchesType = filterType === 'all' || post.type === filterType;
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              post.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <main className="min-h-screen pt-24 pb-12 px-6">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3 justify-center md:justify-start">
                            <Newspaper className="text-blue-500" size={36} />
                            <span className="text-gradient">Publicaciones y Noticias</span>
                        </h1>
                        <p className="text-slate-500">Información oficial, alertas y material educativo del CENAIS.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Buscar noticias..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select 
                                value={filterType}
                                onChange={e => setFilterType(e.target.value)}
                                className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:border-blue-500 appearance-none transition-all cursor-pointer"
                            >
                                <option value="all">Todas las categorías</option>
                                <option value="news">Noticias</option>
                                <option value="alert">Alertas</option>
                                <option value="educational">Educativo</option>
                            </select>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1,2,3,4,5,6].map(i => (
                            <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-100">
                                <div className="h-40 bg-slate-200 rounded-t-2xl"></div>
                                <div className="p-6 space-y-4">
                                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                                    <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-200">
                        <Newspaper size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-bold text-slate-700">No se encontraron publicaciones</h3>
                        <p className="text-slate-500 mt-2">Intenta ajustar los filtros o el término de búsqueda.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredPosts.map(post => (
                            <PostCard key={post._id || post.id} post={post} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
