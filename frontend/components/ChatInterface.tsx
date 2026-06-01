"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Zap, RotateCcw } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
    "¿Qué hacer durante un terremoto?",
    "¿Cuáles son las zonas más sísmicas de Cuba?",
    "¿Cómo preparar un kit de emergencia?",
    "¿Qué magnitud es peligrosa?",
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: '¡Hola! Soy **SER Bot**, tu asistente experto en sismología y seguridad civil. Tengo acceso a datos sísmicos en tiempo real de Cuba. ¿En qué puedo ayudarte hoy?',
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => { scrollToBottom(); }, [messages]);

    const sendMessage = async (text?: string) => {
        const messageText = (text ?? input).trim();
        if (!messageText || isLoading) return;

        const userMsg: Message = { role: 'user', content: messageText, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText }),
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const aiMsg: Message = {
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err: any) {
            setError('No se pudo conectar con el servicio de IA. Verifica que el backend esté activo.');
            console.error('AI Chat error:', err);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const resetChat = () => {
        setMessages([{
            role: 'assistant',
            content: '¡Hola de nuevo! Soy **SER Bot**. ¿En qué puedo ayudarte?',
            timestamp: new Date(),
        }]);
        setError(null);
    };

    // Render
    const renderContent = (text: string) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) =>
            part.startsWith('**') && part.endsWith('**')
                ? <strong key={i}>{part.slice(2, -2)}</strong>
                : <span key={i}>{part}</span>
        );
    };

    const formatTime = (d: Date) =>
        d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="flex flex-col h-[640px] rounded-2xl overflow-hidden border border-slate-200/60 shadow-xl shadow-emerald-500/5">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-400">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <Bot size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm leading-none">SER Bot IA</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse" />
                            <span className="text-emerald-100 text-xs">En línea · Datos en tiempo real</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={resetChat}
                    title="Reiniciar conversación"
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-white"
                >
                    <RotateCcw size={15} />
                </button>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-slate-50 to-white">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-emerald-500/20">
                                <Bot size={13} className="text-white" />
                            </div>
                        )}
                        <div className={`max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                            <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                msg.role === 'user'
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-400 text-white rounded-br-sm shadow-md shadow-emerald-500/20'
                                    : 'bg-white border border-slate-200/70 text-slate-700 rounded-bl-sm shadow-sm'
                            }`}>
                                {renderContent(msg.content)}
                            </div>
                            <span className="text-slate-400 text-[10px] px-1">{formatTime(msg.timestamp)}</span>
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                                <User size={13} className="text-slate-500" />
                            </div>
                        )}
                    </div>
                ))}

                {/* Indicador de escritura */}
                {isLoading && (
                    <div className="flex gap-3 justify-start">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-emerald-500/20">
                            <Bot size={13} className="text-white" />
                        </div>
                        <div className="bg-white border border-slate-200/70 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                            <div className="flex gap-1 items-center h-4">
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

                {/* Error State */}
                {error && (
                    <div className="mx-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Preguntas sugeridas (Solo en el primer mensaje) */}
            {messages.length === 1 && (
                <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200/60 flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                        <button
                            key={i}
                            onClick={() => sendMessage(q)}
                            className="px-3 py-1.5 text-xs rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition font-medium"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {/* Input bar */}
            <div className="px-4 py-4 bg-white border-t border-slate-200/60">
                <div className="flex gap-2 items-center">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder="Escribe tu pregunta sobre sismos..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition"
                        disabled={isLoading}
                    />
                    <button
                        id="chat-send-btn"
                        onClick={() => sendMessage()}
                        disabled={isLoading || !input.trim()}
                        className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl text-white hover:from-emerald-400 hover:to-teal-300 transition shadow-md shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    >
                        <Send size={18} />
                    </button>
                </div>
                <p className="text-center text-slate-400 text-[10px] mt-2">
                    Respuestas generadas por IA · Los datos sísmicos provienen del CENAIS
                </p>
            </div>
        </div>
    );
}
