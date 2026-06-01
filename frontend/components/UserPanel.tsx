"use client";

import { useEffect, useState } from 'react';
import { X, LogOut, Settings, ShieldAlert, Activity, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { removeToken, getToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface UserProfile {
    email: string;
    full_name: string | null;
    bio: string | null;
    location: string | null;
    avatar_url: string | null;
}

export default function UserPanel({ 
    isOpen, 
    onClose, 
    isAdmin, 
    email 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    isAdmin: boolean;
    email: string;
}) {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        full_name: '',
        bio: '',
        location: ''
    });

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        if (isOpen && !profile) {
            fetchProfile();
        }
    }, [isOpen]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setEditForm({
                    full_name: data.full_name || '',
                    bio: data.bio || '',
                    location: data.location || ''
                });
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/auth/me`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editForm)
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setIsEditing(false);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        removeToken();
        window.dispatchEvent(new Event('auth-change'));
        onClose();
        router.push('/');
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');
        
        if (!passwordForm.current_password || !passwordForm.new_password) {
            setPasswordError('Por favor complete todos los campos.');
            return;
        }
        
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            setPasswordError('Las contraseñas nuevas no coinciden.');
            return;
        }
        
        setLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/auth/password`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    current_password: passwordForm.current_password,
                    new_password: passwordForm.new_password
                })
            });
            
            if (res.ok) {
                setPasswordSuccess('¡Contraseña actualizada con éxito!');
                setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
                setTimeout(() => {
                    setIsChangingPassword(false);
                    setPasswordSuccess('');
                }, 3000);
            } else {
                const data = await res.json();
                setPasswordError(data.detail || 'Error al cambiar la contraseña.');
            }
        } catch (err) {
            setPasswordError('Error de red. Inténtelo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteError('');
        setLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/auth/me`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                removeToken();
                window.dispatchEvent(new Event('auth-change'));
                onClose();
                router.push('/');
            } else {
                const data = await res.json();
                setDeleteError(data.detail || 'Error al eliminar la cuenta.');
            }
        } catch (err) {
            setDeleteError('Error de red. Inténtelo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div 
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 transition-opacity"
                onClick={onClose}
            />
            
            {/* Panel — overflow-hidden + h-screen evita el recorte en Safari/móvil */}
            <div className="fixed top-0 right-0 h-screen w-full md:w-96 bg-white shadow-2xl z-[60] flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200 overflow-hidden">
                
                {/* Cabecera fija */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <h2 className="text-xl font-bold text-slate-800">Panel de Usuario</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Área scrollable — min-h-0 es clave para que overflow-y-auto funcione en flex */}
                <div className="flex-1 overflow-y-auto min-h-0 p-6">
                    {loading && !profile ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-pulse text-slate-400">Cargando...</div>
                        </div>
                    ) : profile ? (
                        <div className="space-y-6">
                            {/* Header Perfil */}
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold border-2 border-emerald-500 shadow-sm shrink-0">
                                    {profile.email.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{profile.full_name || profile.email}</h3>
                                    <p className="text-slate-500 text-sm">{profile.email}</p>
                                    {isAdmin && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider">
                                            <ShieldAlert size={12} /> Admin
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Editar Perfil / Info */}
                            {isEditing ? (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Nombre Completo</label>
                                        <input type="text" value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="w-full px-3 py-2 text-sm border rounded mt-1 bg-white" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Ubicación</label>
                                        <input type="text" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} className="w-full px-3 py-2 text-sm border rounded mt-1 bg-white" placeholder="Ej: Santiago de Cuba" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Biografía corta</label>
                                        <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="w-full px-3 py-2 text-sm border rounded mt-1 bg-white" rows={2} />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button onClick={handleSaveProfile} disabled={loading} className="flex-1 bg-emerald-600 text-white py-2 rounded text-sm font-bold hover:bg-emerald-500">Guardar</button>
                                        <button onClick={() => setIsEditing(false)} className="flex-1 bg-slate-200 text-slate-700 py-2 rounded text-sm font-bold hover:bg-slate-300">Cancelar</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Información</h4>
                                        <button onClick={() => setIsEditing(true)} className="text-emerald-600 text-xs font-bold hover:underline">Editar</button>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        {profile.location && <p><span className="text-slate-500">📍 Ubicación:</span> {profile.location}</p>}
                                        {profile.bio && <p><span className="text-slate-500">📝 Bio:</span> {profile.bio}</p>}
                                        {!profile.location && !profile.bio && <p className="text-slate-400 italic">No has completado tu perfil.</p>}
                                    </div>
                                </div>
                            )}

                            {/* Ajustes de Cuenta */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ajustes de Cuenta</h4>
                                
                                {!isChangingPassword ? (
                                    <button 
                                        onClick={() => { setIsChangingPassword(true); setIsDeletingAccount(false); }}
                                        className="w-full text-left text-sm font-semibold text-slate-700 hover:text-emerald-600 transition flex justify-between items-center py-1 group"
                                    >
                                        <span>🔑 Cambiar Contraseña</span>
                                        <span className="text-xs text-slate-400 font-normal group-hover:text-emerald-600 transition-colors">Modificar acceso</span>
                                    </button>
                                ) : (
                                    <form onSubmit={handleChangePassword} className="space-y-3 pt-1 border-t border-slate-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-700">Cambiar Contraseña</span>
                                            <button type="button" onClick={() => { setIsChangingPassword(false); setPasswordError(''); setPasswordSuccess(''); }} className="text-xs text-red-500 hover:underline">Cancelar</button>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-slate-500 uppercase">Contraseña Actual</label>
                                            <input type="password" value={passwordForm.current_password} onChange={e => setPasswordForm({...passwordForm, current_password: e.target.value})} className="w-full px-3 py-2 text-sm border rounded mt-1 bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-slate-500 uppercase">Nueva Contraseña</label>
                                            <input type="password" value={passwordForm.new_password} onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})} className="w-full px-3 py-2 text-sm border rounded mt-1 bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-slate-500 uppercase">Confirmar Nueva Contraseña</label>
                                            <input type="password" value={passwordForm.confirm_password} onChange={e => setPasswordForm({...passwordForm, confirm_password: e.target.value})} className="w-full px-3 py-2 text-sm border rounded mt-1 bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
                                        </div>
                                        {passwordError && <p className="text-xs text-red-500 font-medium">{passwordError}</p>}
                                        {passwordSuccess && <p className="text-xs text-emerald-600 font-bold">{passwordSuccess}</p>}
                                        <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-2 rounded text-xs font-bold hover:bg-emerald-500 transition-colors disabled:opacity-50">
                                            {loading ? 'Guardando...' : 'Actualizar Contraseña'}
                                        </button>
                                    </form>
                                )}

                                <hr className="border-slate-200" />

                                {!isDeletingAccount ? (
                                    <button 
                                        onClick={() => { setIsDeletingAccount(true); setIsChangingPassword(false); }}
                                        className="w-full text-left text-sm font-semibold text-red-500 hover:text-red-700 transition flex justify-between items-center py-1 group"
                                    >
                                        <span>⚠️ Eliminar Cuenta</span>
                                        <span className="text-xs text-red-400 font-normal group-hover:text-red-600 transition-colors">Dar de baja</span>
                                    </button>
                                ) : (
                                    <div className="space-y-3 pt-1 border-t border-slate-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-red-600">Eliminar Cuenta Permanentemente</span>
                                            <button type="button" onClick={() => { setIsDeletingAccount(false); setDeleteError(''); }} className="text-xs text-slate-500 hover:underline">Cancelar</button>
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed">Esta acción es <strong>irreversible</strong>. Se borrarán permanentemente tu cuenta y todos los datos asociados.</p>
                                        {deleteError && <p className="text-xs text-red-500 font-medium">{deleteError}</p>}
                                        <div className="flex gap-2">
                                            <button onClick={handleDeleteAccount} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded text-xs font-bold transition-colors disabled:opacity-50">
                                                {loading ? 'Eliminando...' : 'Sí, eliminar cuenta'}
                                            </button>
                                            <button onClick={() => setIsDeletingAccount(false)} className="flex-1 bg-slate-200 text-slate-700 py-2 rounded text-xs font-bold hover:bg-slate-300">Cancelar</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <hr className="border-slate-100" />

                            {/* Accesos Rápidos */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Atajos</h4>
                                
                                <Link onClick={onClose} href="/dashboard" className="flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition">
                                    <Activity size={18} className="text-emerald-500" />
                                    <span className="font-medium">Mi Actividad (Dashboard)</span>
                                </Link>
                                
                                <Link onClick={onClose} href="/chat" className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition">
                                    <MessageSquare size={18} className="text-blue-500" />
                                    <span className="font-medium">Consultas de IA</span>
                                </Link>
                                
                                {isAdmin && (
                                    <Link onClick={onClose} href="/admin" className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-slate-700 hover:text-red-700 transition">
                                        <Settings size={18} className="text-red-500" />
                                        <span className="font-medium inline-flex items-center gap-2">
                                            Panel de Administración
                                            <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">PRO</span>
                                        </span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-red-500 py-4 text-center">Error cargando perfil.</div>
                    )}
                </div>

                {/* Pie fijo */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-red-100 hover:text-red-600 transition"
                    >
                        <LogOut size={18} />
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </>
    );
}
