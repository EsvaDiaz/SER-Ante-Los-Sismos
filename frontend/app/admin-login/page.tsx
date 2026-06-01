"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [adminSecret, setAdminSecret] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { setToken } = require('@/lib/auth');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password || !adminSecret) {
            setError("Todos los campos son obligatorios.");
            return;
        }

        setLoading(true);
        try {
            const formData = new URLSearchParams();
            formData.append('username', email); // FastAPI OAuth2 expects 'username' field
            formData.append('password', password);
            formData.append('admin_secret', adminSecret);
            formData.append('remember_me', rememberMe.toString());

            const res = await fetch('http://localhost:8000/auth/admin/token', {
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
            router.push('/admin');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-6 relative bg-slate-900">
            {/* Fondo Admin */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/60 p-8 sm:p-12 rounded-3xl shadow-2xl shadow-red-500/10 w-full max-w-md relative z-10 transition-all">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 text-red-500 mb-4 shadow-inner border border-red-500/30">
                        <ShieldAlert size={28} />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Acceso <span className="text-red-500">Admin</span></h2>
                    <p className="text-slate-400 mt-2 text-sm">Portal exclusivo para administradores de SER</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    {error && (
                        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium border border-red-500/20 animate-slide-in">
                            <AlertCircle size={18} className="shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-slate-300">Usuario Administrador</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3.5 rounded-xl bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all"
                            placeholder="Usuario o correo"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-slate-300">Contraseña Secreta del Sistema</label>
                        <input
                            type="password"
                            value={adminSecret}
                            onChange={(e) => setAdminSecret(e.target.value)}
                            className="w-full px-4 py-3.5 rounded-xl bg-red-950/20 border border-red-900/50 text-red-200 placeholder-red-900/50 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all"
                            placeholder="Proporcionada por IT"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-slate-300">Contraseña Personal</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3.5 rounded-xl bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="remember"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500"
                        />
                        <label htmlFor="remember" className="ml-2 text-sm font-medium text-slate-300">
                            Mantener sesión activa
                        </label>
                    </div>

                    <div className="pt-2">
                        <button disabled={loading} className="group relative w-full flex justify-center py-4 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-lg shadow-lg shadow-red-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 overflow-hidden">
                            <span className="relative z-10 flex items-center gap-2">
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Verificando...
                                    </>
                                ) : 'Acceder al Panel'}
                            </span>
                        </button>
                    </div>
                </form>

                <p className="mt-8 text-center text-slate-400 text-sm font-medium">
                    ¿No eres administrador?{' '}
                    <Link href="/login" className="text-emerald-500 hover:text-emerald-400 hover:underline underline-offset-4 transition-all">
                        Volver a inicio de sesión normal
                    </Link>
                </p>
            </div>
        </main>
    );
}
