"use client";

import { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import {
    Save, ArrowLeft, ImageIcon, VideoIcon, FileText,
    UploadCloud, X, Loader2, CheckCircle2, AlertTriangle,
    AudioLines as AudioIcon, Link2 as LinkIcon,
} from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type MediaType = 'image' | 'video' | 'audio' | 'file';

interface UploadedMedia {
    url: string;
    type: MediaType;
    original_name: string;
    size_bytes: number;
}

interface FormData {
    title: string;
    content: string;
    type: string;
    tags: string;
}

// ─── Componente de subida de un archivo ──────────────────────────────────────
function MediaUploader({
    label,
    icon: Icon,
    accept,
    mediaType,
    current,
    onUploaded,
    onRemove,
}: {
    label: string;
    icon: React.ElementType;
    accept: string;
    mediaType: MediaType;
    current: UploadedMedia | null;
    onUploaded: (media: UploadedMedia) => void;
    onRemove: () => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError('');
        setUploading(true);

        try {
            const token = getToken();
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`${API_URL}/media/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Error al subir el archivo.');
            }

            const data: UploadedMedia = await res.json();
            onUploaded(data);
        } catch (err: any) {
            setError(err.message || 'Error de red.');
        } finally {
            setUploading(false);
            // Reset input so same file can be re-selected if needed
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-2">
            <label className="block text-slate-400 text-sm font-medium flex items-center gap-2">
                <Icon size={16} /> {label}
            </label>

            {current ? (
                /* ── Vista previa del archivo subido ── */
                <div className="flex items-center gap-3 bg-slate-800/60 border border-emerald-600/40 rounded-lg px-4 py-3">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                        {mediaType === 'image' && (
                            <img
                                src={`${API_URL}${current.url}`}
                                alt="preview"
                                className="w-full max-h-40 object-cover rounded mb-2"
                            />
                        )}
                        {mediaType === 'video' && (
                            <video
                                src={`${API_URL}${current.url}`}
                                controls
                                className="w-full max-h-40 rounded mb-2"
                            />
                        )}
                        {mediaType === 'audio' && (
                            <audio
                                src={`${API_URL}${current.url}`}
                                controls
                                className="w-full mb-2"
                            />
                        )}
                        <p className="text-white text-xs font-medium truncate">{current.original_name}</p>
                        <p className="text-slate-400 text-xs">{formatBytes(current.size_bytes)}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="text-red-400 hover:text-red-300 shrink-0 p-1"
                        title="Quitar archivo"
                    >
                        <X size={16} />
                    </button>
                </div>
            ) : (
                /* ── Zona de selección ── */
                <div>
                    <input
                        ref={inputRef}
                        type="file"
                        accept={accept}
                        className="hidden"
                        onChange={handleFile}
                    />
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={uploading}
                        className="w-full border-2 border-dashed border-slate-600 hover:border-blue-500 rounded-lg px-4 py-5 flex flex-col items-center gap-2 transition text-slate-400 hover:text-blue-400 disabled:opacity-50"
                    >
                        {uploading ? (
                            <>
                                <Loader2 size={22} className="animate-spin" />
                                <span className="text-sm">Subiendo…</span>
                            </>
                        ) : (
                            <>
                                <UploadCloud size={22} />
                                <span className="text-sm">Haz clic para seleccionar</span>
                                <span className="text-xs text-slate-500">{accept.replace(/,/g, ' · ')}</span>
                            </>
                        )}
                    </button>
                    {error && (
                        <p className="mt-2 flex items-center gap-1 text-xs text-red-400">
                            <AlertTriangle size={13} /> {error}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function NewPostPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const [formData, setFormData] = useState<FormData>({
        title: '',
        content: '',
        type: 'educational',
        tags: '',
    });

    const [imageMedia, setImageMedia]   = useState<UploadedMedia | null>(null);
    const [videoMedia, setVideoMedia]   = useState<UploadedMedia | null>(null);
    const [audioMedia, setAudioMedia]   = useState<UploadedMedia | null>(null);
    const [fileMedia,  setFileMedia]    = useState<UploadedMedia | null>(null);
    const [linkUrl,    setLinkUrl]      = useState('');
    const [linkTitle,  setLinkTitle]    = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');
        setSubmitting(true);

        try {
            const token = getToken();
            const body = {
                ...formData,
                author_id: 'admin',
                tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
                image_url:  imageMedia?.url          || null,
                video_url:  videoMedia?.url          || null,
                audio_url:  audioMedia?.url          || null,
                audio_name: audioMedia?.original_name || null,
                file_url:   fileMedia?.url           || null,
                file_name:  fileMedia?.original_name  || null,
                link_url:   linkUrl.trim()            || null,
                link_title: linkTitle.trim()          || null,
            };

            const res = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Error al crear la publicación.');
            }

            router.push('/admin/posts');
        } catch (err: any) {
            setSubmitError(err.message || 'Error de red.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="px-6 pb-12">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8 flex items-center gap-4">
                    <Link
                        href="/admin/posts"
                        className="p-2 rounded-lg hover:bg-white/5 transition text-slate-400"
                    >
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Nueva Publicación</h1>
                </header>

                <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-xl space-y-6">

                    {/* Título */}
                    <div>
                        <label className="block text-slate-400 mb-2 text-sm font-medium">Título *</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition"
                            placeholder="Ej: Alerta de Sismos en Oriente"
                        />
                    </div>

                    {/* Tipo + Etiquetas */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-slate-400 mb-2 text-sm font-medium">Tipo *</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition appearance-none"
                            >
                                <option value="news">Noticia</option>
                                <option value="alert">Alerta</option>
                                <option value="educational">Educativo</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-slate-400 mb-2 text-sm font-medium">
                                Etiquetas <span className="text-slate-500">(separadas por coma)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition"
                                placeholder="sismo, precaución, cenais"
                            />
                        </div>
                    </div>

                    {/* Contenido */}
                    <div>
                        <label className="block text-slate-400 mb-2 text-sm font-medium">Contenido *</label>
                        <textarea
                            required
                            rows={8}
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition resize-none"
                            placeholder="Escribe el contenido de la publicación…"
                        />
                    </div>

                    {/* ── Sección multimedia ── */}
                    <div className="border-t border-white/10 pt-6 space-y-5">
                        <h3 className="text-slate-300 font-semibold flex items-center gap-2">
                            <UploadCloud size={18} className="text-blue-400" />
                            Multimedia <span className="text-slate-500 text-sm font-normal">(opcional)</span>
                        </h3>

                        {/* Imagen */}
                        <MediaUploader
                            label="Imagen destacada"
                            icon={ImageIcon}
                            accept=".jpg,.jpeg,.png,.gif,.webp"
                            mediaType="image"
                            current={imageMedia}
                            onUploaded={setImageMedia}
                            onRemove={() => setImageMedia(null)}
                        />

                        {/* Vídeo */}
                        <MediaUploader
                            label="Vídeo local (MP4, WebM, MOV…)"
                            icon={VideoIcon}
                            accept=".mp4,.webm,.mov,.avi,.mkv"
                            mediaType="video"
                            current={videoMedia}
                            onUploaded={setVideoMedia}
                            onRemove={() => setVideoMedia(null)}
                        />

                        {/* Documento / Archivo */}
                        <MediaUploader
                            label="Documento adjunto (PDF, DOCX, PPTX, ZIP…)"
                            icon={FileText}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip"
                            mediaType="file"
                            current={fileMedia}
                            onUploaded={setFileMedia}
                            onRemove={() => setFileMedia(null)}
                        />

                        {/* Audio */}
                        <MediaUploader
                            label="Audio (MP3, WAV, OGG, FLAC, AAC, M4A…)"
                            icon={AudioIcon}
                            accept=".mp3,.wav,.ogg,.flac,.aac,.m4a"
                            mediaType="audio"
                            current={audioMedia}
                            onUploaded={setAudioMedia}
                            onRemove={() => setAudioMedia(null)}
                        />

                        {/* Enlace / Página web */}
                        <div className="space-y-2">
                            <label className="block text-slate-400 text-sm font-medium flex items-center gap-2">
                                <LinkIcon size={16} /> Enlace / Página web externa
                            </label>
                            <input
                                type="url"
                                value={linkUrl}
                                onChange={e => setLinkUrl(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition"
                                placeholder="https://www.ejemplo.com/articulo"
                            />
                            {linkUrl.trim() && (
                                <input
                                    type="text"
                                    value={linkTitle}
                                    onChange={e => setLinkTitle(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2 text-white text-sm focus:border-blue-500 outline-none transition"
                                    placeholder="Título descriptivo del enlace (opcional)"
                                />
                            )}
                        </div>
                    </div>

                    {/* Error de envío */}
                    {submitError && (
                        <p className="flex items-center gap-2 text-sm text-red-400 bg-red-900/20 px-4 py-3 rounded-lg border border-red-700/30">
                            <AlertTriangle size={16} /> {submitError}
                        </p>
                    )}

                    {/* Botón publicar */}
                    <div className="flex justify-end pt-4 border-t border-white/5">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-8 py-3 bg-blue-600 rounded-lg hover:bg-blue-500 transition font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? (
                                <><Loader2 size={18} className="animate-spin" /> Publicando…</>
                            ) : (
                                <><Save size={18} /> Publicar</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
