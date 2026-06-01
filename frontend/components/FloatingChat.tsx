"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, User, Minimize2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function FloatingChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(true);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: '¡Hola! 👋 Soy SER Bot. ¿Tienes alguna duda sobre sismos o seguridad?',
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setHasUnread(false);
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const sendMessage = async (text?: string) => {
        const messageText = (text ?? input).trim();
        if (!messageText || isLoading) return;

        setMessages(prev => [...prev, { role: 'user', content: messageText }]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText }),
            });

            if (!res.ok) throw new Error('Error de red');

            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch {
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: '⚠️ No pude conectarme al servicio. Intenta desde la página de chat.' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // Render bold (texto) en el contenido
    const renderContent = (text: string) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((p, i) =>
            p.startsWith('**') && p.endsWith('**')
                ? <strong key={i}>{p.slice(2, -2)}</strong>
                : <span key={i}>{p}</span>
        );
    };

    return (
        <>
            {/* Panel de Chat */}
            <div
                className={`fixed bottom-24 right-6 z-50 w-80 sm:w-96 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-slate-200/60 transition-all duration-300 origin-bottom-right ${
                    isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                }`}
                style={{ maxHeight: '520px' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-400">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Bot size={16} className="text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm leading-none">SER Bot IA</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse" />
                                <span className="text-emerald-100 text-[10px]">En línea</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Link
                            href="/chat"
                            title="Abrir chat completo"
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-white"
                        >
                            <ExternalLink size={14} />
                        </Link>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-white"
                        >
                            <Minimize2 size={14} />
                        </button>
                    </div>
                </div>

                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white" style={{ maxHeight: '340px' }}>
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                    <Bot size={11} className="text-white" />
                                </div>
                            )}
                            <div className={`max-w-[84%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                                msg.role === 'user'
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-400 text-white rounded-br-sm'
                                    : 'bg-slate-100 text-slate-700 rounded-bl-sm border border-slate-200/60'
                            }`}>
                                {renderContent(msg.content)}
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <User size={11} className="text-slate-500" />
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-2 justify-start">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                <Bot size={11} className="text-white" />
                            </div>
                            <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-3 py-2.5 border border-slate-200/60">
                                <div className="flex gap-1 items-center h-3">
                                    {[0, 1, 2].map(i => (
                                        <span
                                            key={i}
                                            className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"
                                            style={{ animationDelay: `${i * 0.15}s` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Sugerencias rápidas (solo la primera carga) */}
                {messages.length === 1 && (
                    <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {['¿Qué hacer en un sismo?', '¿Últimos sismos?'].map((q, i) => (
                            <button
                                key={i}
                                onClick={() => sendMessage(q)}
                                className="px-2.5 py-1 text-[11px] rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition font-medium"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div className="px-3 py-3 bg-white border-t border-slate-200/60 flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        placeholder="Escribe tu pregunta..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition"
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={isLoading || !input.trim()}
                        className="p-2 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl text-white hover:from-emerald-400 hover:to-teal-300 transition disabled:opacity-40 flex-shrink-0 shadow-md shadow-emerald-500/20"
                    >
                        <Send size={15} />
                    </button>
                </div>
            </div>

            {/* Botón FAB */}
            <button
                id="floating-chat-btn"
                onClick={() => setIsOpen(prev => !prev)}
                aria-label="Abrir asistente IA"
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl shadow-emerald-500/30 flex items-center justify-center transition-all duration-300 ${
                    isOpen
                        ? 'bg-slate-700 hover:bg-slate-600 rotate-0'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 hover:scale-110'
                }`}
            >
                {/* Dot de no leído */}
                {hasUnread && !isOpen && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">1</span>
                    </span>
                )}
                {/* Pulse ring cuando cierre */}
                {!isOpen && (
                    <span className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping" />
                )}
                {isOpen ? <X size={22} className="text-white" /> : <Bot size={24} className="text-white" />}
            </button>
        </>
    );
}
