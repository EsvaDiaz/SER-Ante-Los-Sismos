"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, AlertCircle, CheckCircle2, Phone, Calendar, Users } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        nombre: '',
        apellidos: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        age: '',
        sex: '',
    });
    const [error, setError]     = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }
        if (!formData.phone.trim()) {
            setError("El número de teléfono es obligatorio.");
            return;
        }
        const age = parseInt(formData.age);
        if (!formData.age || isNaN(age) || age < 1 || age > 120) {
            setError("Ingresa una edad válida entre 1 y 120 años.");
            return;
        }
        if (!formData.sex) {
            setError("Selecciona tu sexo.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    full_name: `${formData.nombre} ${formData.apellidos}`.trim(),
                    phone: formData.phone.trim(),
                    age: age,
                    sex: formData.sex,
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Error al registrarse");
            }

            setSuccess("¡Registro exitoso! Redirigiendo al inicio de sesión...");
            setTimeout(() => router.push('/login'), 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all";
    const labelClass = "block text-sm font-semibold text-slate-700 mb-1.5";

    return (
        <main className="min-h-screen flex items-center justify-center p-6 relative bg-slate-50/50">
            {/* Fondo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-200/30 rounded-full blur-3xl animate-float" />
                <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-teal-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-lg relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4 shadow-inner">
                        <UserPlus size={28} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800">Únete a <span className="text-gradient">SER</span></h2>
                    <p className="text-slate-500 mt-2 text-sm">Crea tu cuenta para recibir alertas inmediatas</p>
                    <p className="mt-2 text-sm">
                        <Link href="/admin-register" className="text-emerald-600 hover:text-emerald-500 hover:underline underline-offset-4 transition-all">
                            ¿Eres Administrador?
                        </Link>
                    </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 animate-slide-in">
                            <AlertCircle size={18} className="shrink-0" /><p>{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-100 animate-slide-in">
                            <CheckCircle2 size={18} className="shrink-0 text-emerald-500" /><p>{success}</p>
                        </div>
                    )}

                    {/* Nombre y Apellidos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Nombre <span className="text-red-500">*</span></label>
                            <input required type="text" value={formData.nombre}
                                onChange={e => setFormData({...formData, nombre: e.target.value})}
                                className={inputClass} placeholder="Tu Nombre" />
                        </div>
                        <div>
                            <label className={labelClass}>Apellidos</label>
                            <input type="text" value={formData.apellidos}
                                onChange={e => setFormData({...formData, apellidos: e.target.value})}
                                className={inputClass} placeholder="Tus Apellidos" />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className={labelClass}>Correo Electrónico <span className="text-red-500">*</span></label>
                        <input required type="email" value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className={inputClass} placeholder="tu.correo@mail.com" />
                    </div>

                    {/* Teléfono */}
                    <div>
                        <label className={labelClass}>
                            <span className="inline-flex items-center gap-1.5"><Phone size={14}/> Teléfono <span className="text-red-500">*</span></span>
                        </label>
                        <input required type="tel" value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className={inputClass} placeholder="+5358123456" />
                    </div>

                    {/* Edad y Sexo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>
                                <span className="inline-flex items-center gap-1.5"><Calendar size={14}/> Edad <span className="text-red-500">*</span></span>
                            </label>
                            <input required type="number" min={1} max={120} value={formData.age}
                                onChange={e => setFormData({...formData, age: e.target.value})}
                                className={inputClass} placeholder="Ej: 28" />
                        </div>
                        <div>
                            <label className={labelClass}>
                                <span className="inline-flex items-center gap-1.5"><Users size={14}/> Sexo <span className="text-red-500">*</span></span>
                            </label>
                            <select required value={formData.sex}
                                onChange={e => setFormData({...formData, sex: e.target.value})}
                                className={`${inputClass} appearance-none`}>
                                <option value="">Seleccionar...</option>
                                <option value="M">Masculino</option>
                                <option value="F">Femenino</option>
                            </select>
                        </div>
                    </div>

                    {/* Contraseña */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Contraseña <span className="text-red-500">*</span></label>
                            <input required type="password" value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                                className={inputClass} placeholder="Mín. 6 caracteres" />
                        </div>
                        <div>
                            <label className={labelClass}>Confirmar contraseña <span className="text-red-500">*</span></label>
                            <input required type="password" value={formData.confirmPassword}
                                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                                className={inputClass} placeholder="Repite la contraseña" />
                        </div>
                    </div>

                    <p className="text-xs text-slate-400">Los campos marcados con <span className="text-red-500">*</span> son obligatorios.</p>

                    <div className="pt-2">
                        <button disabled={loading}
                            className="group w-full flex justify-center py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-lg shadow-lg shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0">
                            <span className="flex items-center gap-2">
                                {loading ? (
                                    <><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>Creando cuenta...</>
                                ) : 'Empezar ahora'}
                            </span>
                        </button>
                    </div>
                </form>

                <p className="mt-6 text-center text-slate-500 text-sm font-medium">
                    ¿Ya tienes una cuenta?{' '}
                    <Link href="/login" className="text-emerald-600 hover:text-emerald-500 hover:underline underline-offset-4 transition-all">
                        Inicia sesión aquí
                    </Link>
                </p>
            </div>
        </main>
    );
}
