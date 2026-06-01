"use client";

import { Mail, Phone, MessageCircle, HelpCircle } from 'lucide-react';

export default function SupportPage() {
    return (
        <main className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-center text-gradient">Centro de Soporte</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="glass-panel p-6 rounded-xl text-center">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail size={24} className="text-white" />
                        </div>
                        <h3 className="font-bold mb-2">Email</h3>
                        <p className="text-slate-400 text-sm">soporte@sercuba.cu</p>
                    </div>

                    <div className="glass-panel p-6 rounded-xl text-center">
                        <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Phone size={24} className="text-white" />
                        </div>
                        <h3 className="font-bold mb-2">Teléfono</h3>
                        <p className="text-slate-400 text-sm">+53 22 123456</p>
                    </div>

                    <div className="glass-panel p-6 rounded-xl text-center">
                        <div className="w-12 h-12 bg-[#24A1DE] rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageCircle size={24} className="text-white" />
                        </div>
                        <h3 className="font-bold mb-2">Telegram</h3>
                        <p className="text-slate-400 text-sm">@SismoCubaBot</p>
                    </div>
                </div>

                <section className="glass-panel p-8 rounded-2xl">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <HelpCircle className="text-blue-400" />
                        Preguntas Frecuentes
                    </h3>

                    <div className="space-y-6">
                        {[
                            { q: "¿Cómo registro mi ubicación?", a: "Puedes registrarla desde el Panel de Usuario o permitiendo el acceso GPS cuando el navegador lo solicite." },
                            { q: "¿El bot funciona sin internet?", a: "El bot de Telegram requiere conexión, pero una vez cargada, la web puede mostrar la última información almacenada en caché." },
                            { q: "¿Cómo reporto un sismo?", a: "Ve a la sección de Comentarios en la página principal o usa el comando /reportar en el bot de Telegram." },
                        ].map((faq, i) => (
                            <div key={i} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                <h4 className="font-semibold text-slate-200 mb-2">{faq.q}</h4>
                                <p className="text-slate-400 text-sm">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
