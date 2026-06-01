"use client";

import { useState, useEffect } from 'react';
import { Edit, Trash, Plus } from 'lucide-react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AdminPosts() {
    const [posts, setPosts] = useState<any[]>([]);

    useEffect(() => {
        const loadPosts = async () => {
            try {
                const data = await fetchAPI('/posts?limit=50');
                setPosts(data);
            } catch (error) {
                console.error(error);
            }
        };
        loadPosts();
    }, []);

    const handleDelete = async (postId: string) => {
        if (!confirm('¿Seguro que deseas eliminar esta publicación?')) return;
        try {
            await fetch(`${API_URL}/posts/${postId}`, { method: 'DELETE' });
            setPosts(prev => prev.filter(p => p._id !== postId));
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    return (
        <main className="px-6 pb-12">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-white">Gestión de Publicaciones</h1>
                    <Link href="/admin/posts/new" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition flex items-center gap-2">
                        <Plus size={18} /> Nueva Publicación
                    </Link>
                </header>

                <div className="glass-panel rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-800/80">
                            <tr>
                                <th className="p-4 text-slate-400 font-medium">Título</th>
                                <th className="p-4 text-slate-400 font-medium">Tipo</th>
                                <th className="p-4 text-slate-400 font-medium">Media</th>
                                <th className="p-4 text-slate-400 font-medium">Fecha</th>
                                <th className="p-4 text-slate-400 font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {posts.map((post, index) => (
                                <tr key={post._id || `post-row-${index}`} className="hover:bg-white/5 transition">
                                    <td className="p-4 text-white font-medium max-w-xs truncate">{post.title}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${
                                            post.type === 'alert' ? 'bg-red-500/20 text-red-400' :
                                            post.type === 'educational' ? 'bg-green-500/20 text-green-400' :
                                            'bg-blue-500/20 text-blue-400'
                                        }`}>
                                            {post.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-400 text-sm">
                                        <div className="flex gap-1 flex-wrap">
                                            {post.image_url && <span title="Imagen">🖼️</span>}
                                            {post.video_url && <span title="Video">🎬</span>}
                                            {post.audio_url && <span title="Audio">🎵</span>}
                                            {post.file_url && <span title="Archivo">📄</span>}
                                            {post.link_url && <span title="Enlace">🔗</span>}
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-400">{new Date(post.created_at).toLocaleDateString('es-ES')}</td>
                                    <td className="p-4 flex gap-3">
                                        <button className="text-blue-400 hover:text-blue-300" title="Editar">
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            className="text-red-400 hover:text-red-300"
                                            title="Eliminar"
                                            onClick={() => handleDelete(post._id)}
                                        >
                                            <Trash size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {posts.length === 0 && (
                                <tr key="empty-row">
                                    <td colSpan={5} className="p-8 text-center text-slate-500">No hay publicaciones aún.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
