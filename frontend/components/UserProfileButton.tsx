"use client";

import { useState } from 'react';
import { User, ShieldAlert } from 'lucide-react';
import { getEmail } from '@/lib/auth';
import UserPanel from './UserPanel';

export default function UserProfileButton({ isAdmin }: { isAdmin: boolean }) {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const email = getEmail() || 'Usuario';
    const initial = email.charAt(0).toUpperCase();

    return (
        <>
            <button 
                onClick={() => setIsPanelOpen(true)}
                className="relative group flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors border-2 border-emerald-500 shadow-md"
                title="Abrir panel de usuario"
            >
                <span className="font-bold text-lg">{initial}</span>
                {isAdmin && (
                    <div className="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full p-0.5 border-2 border-white" title="Administrador">
                        <ShieldAlert size={12} />
                    </div>
                )}
            </button>

            {isPanelOpen && (
                <UserPanel 
                    isOpen={isPanelOpen} 
                    onClose={() => setIsPanelOpen(false)} 
                    isAdmin={isAdmin} 
                    email={email}
                />
            )}
        </>
    );
}
