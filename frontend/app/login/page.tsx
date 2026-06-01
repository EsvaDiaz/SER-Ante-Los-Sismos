"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Send, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { setToken } = require('@/lib/auth');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError("Todos los campos son obligatorios.");
            return;
        }

        setLoading(true);
        try {
            const formData = new URLSearchParams();
            formData.append('username', email); // FastAPI OAuth2 expects 'username' field
            formData.append('password', password);
            formData.append('remember_me', rememberMe.toString());

            const res = await fetch('http://localhost:8000/auth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString()
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Error en el inicio de sesión");
            }

            const data = await res.json();
            setToken(data.access_token, rememberMe);
            window.dispatchEvent(new Event('auth-change'));
            router.push('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-6 relative bg-slate-50/50">
            {/* Formas de Fondo Estilizadas */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-300/20 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 p-8 sm:p-12 rounded-3xl shadow-2xl w-full max-w-md relative z-10 transition-all">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4 shadow-inner">
                        <LogIn size={28} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800">Bienvenido a <span className="text-gradient">SER</span></h2>
                    <p className="text-slate-500 mt-2 text-sm">Inicia sesión y ten acceso a Reportes Sísmicos de Cuba en tiempo real</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    {error && (
                        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 animate-slide-in">
                            <AlertCircle size={18} className="shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-slate-700">Correo Electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                            placeholder="Tu correo electrónico"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-slate-700">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="remember"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <label htmlFor="remember" className="ml-2 text-sm font-medium text-gray-900">
                            Recordar en este dispositivo
                        </label>
                    </div>

                    <div className="pt-2">
                        <button disabled={loading} className="group relative w-full flex justify-center py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-lg shadow-lg shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 overflow-hidden">
                            <span className="relative z-10 flex items-center gap-2">
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Validando...
                                    </>
                                ) : 'Ingresar'}
                            </span>
                        </button>
                    </div>
                </form>

                <div className="mt-8 flex items-center justify-between">
                    <div className="h-px bg-slate-200 w-full"></div>
                    <span className="px-4 text-slate-400 text-sm font-medium">O</span>
                    <div className="h-px bg-slate-200 w-full"></div>
                </div>

                <button className="mt-8 w-full py-3.5 rounded-xl bg-[#24A1DE]/10 hover:bg-[#24A1DE]/20 text-[#24A1DE] border border-[#24A1DE]/20 font-bold flex items-center justify-center gap-3 transition-colors group">
                    <Send size={20} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                    Entrar con Telegram
                </button>

                <p className="mt-10 text-center text-slate-500 text-sm font-medium">
                    ¿No tienes cuenta?{' '}
                    <Link href="/register" className="text-emerald-600 hover:text-emerald-500 hover:underline underline-offset-4 transition-all">
                        Crear una cuenta
                    </Link>
                </p>
                <p className="mt-2 text-center text-slate-500 text-sm font-medium">
                    ¿Eres un admin?{' '}
                    <Link href="/admin-login" className="text-red-500 hover:text-red-600 hover:underline underline-offset-4 transition-all">
                        Iniciar sesión como administrador
                    </Link>
                </p>
            </div>
        </main>
    );
}
