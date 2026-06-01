import ChatInterface from '@/components/ChatInterface';
import { Bot, Shield, Zap, Database } from 'lucide-react';

export const metadata = {
    title: 'Consulta IA · SER Cuba',
    description: 'Resuelve tus dudas sobre actividad sísmica y seguridad con nuestro asistente experto basado en IA con datos del CENAIS en tiempo real.',
};

const FEATURES = [
    { icon: <Database size={16} />, text: 'Datos sísmicos en tiempo real' },
    { icon: <Shield size={16} />, text: 'Información verificada CENAIS' },
    { icon: <Zap size={16} />, text: 'Respuestas instantáneas' },
];

export default function ChatPage() {
    return (
        <main className="min-h-screen pt-20 pb-16 px-6">
            {/* Decoración de Fondo */}
            <div className="fixed inset-0 -z-10 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl" />
            </div>

            <div className="max-w-4xl mx-auto">
                {/* Header de Página */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-medium text-sm mb-4">
                        <Bot size={14} />
                        <span>Asistente Inteligente</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Consulta a la <span className="text-gradient">IA Sismológica</span>
                    </h1>
                    <p className="text-slate-500 text-lg max-w-xl mx-auto">
                        Resuelve tus dudas sobre actividad sísmica, prevención y seguridad con nuestro asistente experto.
                    </p>

                    {/* Feature Pills */}
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                        {FEATURES.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-slate-600 text-xs font-medium">
                                <span className="text-emerald-500">{f.icon}</span>
                                {f.text}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat */}
                <ChatInterface />

                {/* Disclaimer */}
                <p className="text-center text-slate-400 text-xs mt-6">
                    Este asistente utiliza IA y datos reales del CENAIS. Ante una emergencia, llama al <strong>104</strong> o <strong>105</strong>.
                </p>
            </div>
        </main>
    );
}
