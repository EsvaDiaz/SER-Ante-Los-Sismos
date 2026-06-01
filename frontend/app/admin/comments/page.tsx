"use client";

import { useState, useEffect } from 'react';
import { MessageCircle, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';

interface Comment {
    id: string;
    user: string;
    text: string;
    time: string;
}

export default function AdminComments() {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);

    const loadComments = async () => {
        try {
            const data = await fetchAPI('/comments?limit=100');
            setComments(data);
        } catch (e) {
            console.error("Failed to fetch comments", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadComments();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm("¿Seguro que deseas eliminar este comentario?")) return;

        try {
            await fetchAPI(`/comments/${id}`, { method: 'DELETE' });
            setComments(comments.filter(c => c.id !== id));
        } catch (e) {
            console.error("Failed to delete comment", e);
            alert("No se pudo eliminar el comentario");
        }
    };

    return (
        <main className="px-6 pb-12 min-h-[80vh]">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8 flex items-center gap-4">
                    <Link href="/admin" className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition text-slate-300">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <MessageCircle className="text-emerald-400" />
                            Moderación de Comentarios
                        </h1>
                        <p className="text-slate-400">Revisa y elimina la retroalimentación inapropiada de la comunidad.</p>
                    </div>
                </header>

                <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                    {loading ? (
                        <div className="p-10 text-center text-slate-400">Cargando comentarios...</div>
                    ) : comments.length === 0 ? (
                        <div className="p-10 text-center text-slate-400">No hay comentarios en la base de datos.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-800 text-slate-300 text-sm border-b border-slate-700">
                                    <th className="p-4 font-semibold">Usuario</th>
                                    <th className="p-4 font-semibold">Comentario</th>
                                    <th className="p-4 font-semibold">Fecha</th>
                                    <th className="p-4 font-semibold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comments.map((comment) => (
                                    <tr key={comment.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition group">
                                        <td className="p-4 text-white font-medium whitespace-nowrap">
                                            {comment.user}
                                        </td>
                                        <td className="p-4 text-slate-300 max-w-md break-words">
                                            {comment.text}
                                        </td>
                                        <td className="p-4 text-slate-400 text-sm whitespace-nowrap">
                                            {new Date(comment.time).toLocaleString('es-ES', {
                                                day: '2-digit', month: '2-digit', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDelete(comment.id)}
                                                className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                title="Eliminar Comentario"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </main>
    );
}
