"use client";

import { useState, useEffect } from 'react';
import { getToken, isAuthenticated } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const AVAILABLE_EMOJIS = ["👍", "❤️", "😮", "😢", "🔥", "🌍"];

export default function EmojiReactions({ postId }: { postId: string }) {
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [userReaction, setUserReaction] = useState<string | null>(null);
    const [showPalette, setShowPalette] = useState(false);
    
    useEffect(() => {
        fetchReactions();
    }, [postId]);

    const fetchReactions = async () => {
        try {
            const res = await fetch(`${API_URL}/reactions/${postId}`);
            if (res.ok) {
                const data = await res.json();
                setCounts(data.counts);
                // Si el usuario está autenticado, verificar su reacción
                const token = getToken();
                if (token) {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const email = payload.sub;
                    for (const [emoji, users] of Object.entries(data.users)) {
                        if (email) {
                            if ((users as string[]).includes(email)) {
                                setUserReaction(emoji);
                                break;
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching reactions:", error);
        }
    };

    const handleReact = async (emoji: string) => {
        if (!isAuthenticated()) {
            alert("Debes iniciar sesión para reaccionar.");
            return;
        }

        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/reactions/${postId}?emoji=${encodeURIComponent(emoji)}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'added' || data.status === 'updated') {
                    setUserReaction(emoji);
                } else if (data.status === 'removed') {
                    setUserReaction(null);
                }
                fetchReactions(); // Refrescar conteos
            }
        } catch (error) {
            console.error("Error reacting:", error);
        } finally {
            setShowPalette(false);
        }
    };

    const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);

    return (
        <div className="relative inline-flex items-center gap-2">
            <button 
                onClick={() => setShowPalette(!showPalette)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                    userReaction 
                        ? 'bg-blue-50 border-blue-200 text-blue-700' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
            >
                <span>{userReaction || "👍"}</span>
                <span className="font-semibold">{totalReactions}</span>
            </button>

            {/* Quick summary of top emojis */}
            {totalReactions > 0 && !showPalette && (
                <div className="flex -space-x-1">
                    {Object.entries(counts)
                        .filter(([_, count]) => count > 0)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([emoji], i) => (
                            <span key={emoji} className="text-xs bg-white rounded-full p-0.5 border shadow-sm z-[3-i]">
                                {emoji}
                            </span>
                        ))}
                </div>
            )}

            {/* Floating Palette */}
            {showPalette && (
                <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-2xl shadow-xl border border-slate-200 flex gap-1 animate-slide-in z-20">
                    {AVAILABLE_EMOJIS.map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => handleReact(emoji)}
                            className={`w-10 h-10 flex items-center justify-center text-xl rounded-full hover:bg-slate-100 hover:scale-125 transition-all transform ${userReaction === emoji ? 'bg-blue-50 border border-blue-200' : ''}`}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
