"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import dynamic from 'next/dynamic';

const UserProfileButton = dynamic(() => import('./UserProfileButton'), { ssr: false });

export default function Navbar() {
    const pathname = usePathname();
    const [isAuth, setIsAuth] = useState(false);
    const [isUserAdmin, setIsUserAdmin] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkAuth = () => {
            setIsAuth(isAuthenticated());
            setIsUserAdmin(isAdmin());
        };
        checkAuth();
        
        window.addEventListener('storage', checkAuth);
        window.addEventListener('auth-change', checkAuth);
        
        return () => {
            window.removeEventListener('storage', checkAuth);
            window.removeEventListener('auth-change', checkAuth);
        };
    }, []);

    const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register') || pathname?.startsWith('/admin-login') || pathname?.startsWith('/admin-register');
    const isAdminDashboard = pathname?.startsWith('/admin') && !isAuthPage;

    if (isAuthPage || isAdminDashboard) return null;

    return (
        <nav className="glass-panel fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center backdrop-blur-md bg-white/80">
            <Link href="/" className="text-2xl font-bold text-gradient">SER Cuba</Link>

            <div className="hidden md:flex items-center space-x-6">
                <Link href="/" className="text-slate-700 hover:text-emerald-500 transition">Inicio</Link>
                <Link href="/alertas" className="text-slate-700 hover:text-emerald-500 transition">Alertas Sísmicas</Link>
                <Link href="/noticias" className="text-slate-700 hover:text-emerald-500 transition">Noticias</Link>
                <Link href="/history" className="text-slate-700 hover:text-emerald-500 transition">Historia</Link>
                <Link href="/chat" className="text-slate-700 hover:text-emerald-500 transition">Asistente IA</Link>
            </div>

            <div className="flex items-center space-x-4">
                {mounted && isAuth ? (
                    <UserProfileButton isAdmin={isUserAdmin} />
                ) : mounted ? (
                    <>
                        <Link href="/login" className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition hidden sm:inline-block">Entrar</Link>
                        <Link href="/register" className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-500/30">
                            Registrarse
                        </Link>
                    </>
                ) : (
                    <div className="w-24 h-10 animate-pulse bg-slate-200 rounded-lg"></div>
                )}
            </div>
        </nav>
    );
}
