"use client";

import { useState, useEffect } from 'react';
import { getToken, isAuthenticated, isAdmin } from '@/lib/auth';
import { ClipboardList, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const SURVEY_EMOJIS = ["😍", "🙂", "😐", "😕", "😠"];

export default function PostSurvey({ postId }: { postId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        emoji_rating: '',
        liked_most: '',
        recommendation: ''
    });

    const [adminSummary, setAdminSummary] = useState<any>(null);

    useEffect(() => {
        if (isAuthenticated()) {
            checkStatus();
            if (isAdmin()) {
                fetchAdminSummary();
            }
        } else {
            setLoading(false);
        }
    }, [postId]);

    const checkStatus = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/surveys/${postId}/mine`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHasSubmitted(data.submitted);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAdminSummary = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/surveys/${postId}/summary`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setAdminSummary(await res.json());
            }
        } catch (error) {}
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/surveys/${postId}`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setHasSubmitted(true);
                setIsOpen(false);
                if (isAdmin()) fetchAdminSummary();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated() && !adminSummary) return null;

    if (hasSubmitted && !adminSummary) {
        return (
            <div className="mt-6 flex items-center justify-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                <CheckCircle2 size={18} />
                <span className="font-medium text-sm">Gracias por completar la encuesta de esta publicación.</span>
            </div>
        );
    }

    return (
        <div className="mt-8 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
                <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <ClipboardList size={18} className="text-blue-500" />
                    Encuesta de la Publicación
                </div>
                {isOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
            </button>

            {isOpen && (
                <div className="p-5 border-t border-slate-200">
                    {!hasSubmitted && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">¿Cómo calificarías esta información? (Opcional)</label>
                                <div className="flex gap-2">
                                    {SURVEY_EMOJIS.map(emoji => (
                                        <button
                                            type="button"
                                            key={emoji}
                                            onClick={() => setFormData({...formData, emoji_rating: emoji})}
                                            className={`w-12 h-12 text-2xl rounded-full transition-all ${formData.emoji_rating === emoji ? 'bg-blue-100 scale-110 shadow-inner border-2 border-blue-400' : 'bg-slate-100 hover:bg-slate-200 grayscale hover:grayscale-0'}`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">¿Qué fue lo que más te gustó? (Opcional)</label>
                                <textarea 
                                    value={formData.liked_most}
                                    onChange={e => setFormData({...formData, liked_most: e.target.value})}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                                    rows={2}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">¿Qué nos recomendarías? (Opcional)</label>
                                <textarea 
                                    value={formData.recommendation}
                                    onChange={e => setFormData({...formData, recommendation: e.target.value})}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                                    rows={2}
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition"
                            >
                                Enviar Respuestas
                            </button>
                        </form>
                    )}

                    {adminSummary && (
                        <div className="mt-6 pt-6 border-t border-dashed border-slate-300">
                            <h4 className="font-bold text-red-600 mb-4 flex items-center gap-2">
                                📊 Resumen Admin ({adminSummary.total_responses} respuestas)
                            </h4>
                            
                            {adminSummary.total_responses > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        {Object.entries(adminSummary.ratings_count).map(([emoji, count]) => (
                                            <div key={emoji} className="text-center">
                                                <div className="text-2xl">{emoji}</div>
                                                <div className="text-xs font-bold text-slate-500">{String(count)}</div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {adminSummary.recommendations.length > 0 && (
                                        <div className="bg-slate-50 p-3 rounded-xl text-sm">
                                            <span className="font-bold text-slate-700">Recomendaciones:</span>
                                            <ul className="list-disc pl-4 mt-2 space-y-1 text-slate-600">
                                                {adminSummary.recommendations.map((r: any, i: number) => (
                                                    <li key={i}>{r.text} <span className="text-xs text-slate-400">({r.user})</span></li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">Aún no hay respuestas a la encuesta.</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
