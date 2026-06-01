"use client";

import { useState, useEffect } from 'react';
import { getToken, isAuthenticated, isAdmin, getEmail } from '@/lib/auth';
import { Send, Trash2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Comment {
    _id: string;
    user_id: string;
    username: string;
    content: string;
    timestamp: string;
    avatar_url?: string;
}

export default function PostComments({ postId }: { postId: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const fetchComments = async () => {
        try {
            const res = await fetch(`${API_URL}/post-comments/${postId}`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !isAuthenticated()) return;

        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/post-comments/${postId}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ content: newComment })
            });
            if (res.ok) {
                setNewComment('');
                fetchComments();
            }
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm("¿Eliminar este comentario?")) return;
        
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/post-comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchComments();
            }
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    };

    return (
        <div className="mt-8 space-y-6">
            <h3 className="font-bold text-lg text-slate-800">Comentarios ({comments.length})</h3>

            {isAuthenticated() ? (
                <form onSubmit={handleAddComment} className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 font-bold text-emerald-700">
                        {getEmail()?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 relative">
                        <textarea 
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            placeholder="Añade un comentario..."
                            className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500 resize-none min-h-[44px]"
                            rows={1}
                        />
                        <button 
                            type="submit" 
                            disabled={!newComment.trim()}
                            className="absolute right-2 bottom-2 p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-50"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            ) : (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center text-sm text-slate-500">
                    Debes <a href="/login" className="text-emerald-600 font-bold hover:underline">iniciar sesión</a> para comentar.
                </div>
            )}

            <div className="space-y-4">
                {loading ? (
                    <div className="animate-pulse flex gap-3"><div className="w-10 h-10 bg-slate-200 rounded-full"></div><div className="flex-1 h-20 bg-slate-200 rounded-xl"></div></div>
                ) : comments.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-4">Aún no hay comentarios. ¡Sé el primero!</p>
                ) : comments.map(comment => (
                    <div key={comment._id} className="flex gap-3 group">
                        {comment.avatar_url ? (
                            <img src={comment.avatar_url} alt="" className="w-10 h-10 rounded-full shrink-0 object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0 font-bold text-slate-600">
                                {comment.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="flex-1">
                            <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-100 inline-block w-full">
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-sm text-slate-800">{comment.username}</span>
                                    {(isAdmin() || getEmail() === comment.user_id) && (
                                        <button onClick={() => handleDelete(comment._id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                                <p className="text-slate-700 text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                            </div>
                            <span className="text-xs text-slate-400 ml-2 mt-1 inline-block">
                                {new Date(comment.timestamp).toLocaleString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
