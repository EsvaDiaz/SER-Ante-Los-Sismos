"use client";

import { useState, useEffect } from 'react';
import { User, MessageCircle } from 'lucide-react';
import { fetchAPI } from '@/lib/api';

interface Comment {
    id: string;
    user: string;
    text: string;
    time: string;
}

export default function CommentsSection() {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);

    const loadComments = async () => {
        try {
            const data = await fetchAPI('/comments?limit=50');
            setComments(data);
        } catch (e) {
            console.error("Failed to load comments", e);
        }
    };

    useEffect(() => {
        loadComments();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setLoading(true);
        try {
            // Determina al usuario por el token/local o trata como Anónimo
            let username = "Anónimo";
            const token = localStorage.getItem('token'); // Simplificado de momento
            if (token) {
                username = "Usuario Registrado"; // Aplicaciones reales decodifican JWT aquí
            }

            await fetchAPI('/comments', {
                method: 'POST',
                body: JSON.stringify({ user: username, text: newComment })
            });

            setNewComment("");
            await loadComments();
        } catch (e) {
            console.error("Failed to post comment", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-12 bg-slate-50/50 border-t border-slate-200">
            <div className="max-w-4xl mx-auto px-6">
                <h3 className="text-2xl font-bold mb-8 flex items-center gap-2 text-slate-800">
                    <MessageCircle className="text-emerald-500" />
                    Comentarios de la Comunidad
                </h3>

                <form onSubmit={handleSubmit} className="mb-8 flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Comparte tu reporte o pregunta sobre sismos recientes..."
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-slate-800 placeholder-slate-400 transition shadow-sm"
                        maxLength={300}
                    />
                    <button disabled={loading} className="px-6 py-3 bg-emerald-600 rounded-xl text-white hover:bg-emerald-500 transition font-medium shadow-md shadow-emerald-500/20 disabled:opacity-50">
                        {loading ? 'Publicando...' : 'Publicar'}
                    </button>
                </form>

                <div className="space-y-4">
                    {comments.length === 0 ? (
                        <p className="text-slate-500 italic text-center py-6">Aún no hay comentarios. ¡Sé el primero en compartir algo!</p>
                    ) : (
                        comments.map((comment) => {
                            const dateStr = new Date(comment.time).toLocaleString('es-ES', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            });

                            return (
                                <div key={comment.id} className="bg-white border border-slate-100 p-4 rounded-xl flex gap-4 shadow-sm">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                        <User size={20} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-slate-800">{comment.user}</span>
                                            <span className="text-xs text-slate-500">{dateStr}</span>
                                        </div>
                                        <p className="text-slate-600 leading-relaxed text-sm">{comment.text}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </section>
    );
}
