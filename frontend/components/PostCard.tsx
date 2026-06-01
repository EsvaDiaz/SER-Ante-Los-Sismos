"use client";

import { useState } from 'react';
import EmojiReactions from './EmojiReactions';
import PostComments from './PostComments';
import PostSurvey from './PostSurvey';
import { MessageCircle, FileText, AlertTriangle, BookOpen, X, ExternalLink, Music, Download } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PostProps {
    post: any;
}

/** Convierte URLs locales /static/... al host del backend */
function mediaUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('/static/')) return `${API_URL}${url}`;
    return url;
}

export default function PostCard({ post }: PostProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const date = new Date(post.created_at).toLocaleDateString('es-ES', { 
        day: 'numeric', month: 'long', year: 'numeric' 
    });

    const getIcon = () => {
        switch(post.type) {
            case 'alert': return <AlertTriangle size={18} className="text-red-500" />;
            case 'educational': return <BookOpen size={18} className="text-emerald-500" />;
            default: return <FileText size={18} className="text-blue-500" />;
        }
    };

    const getBadgeStyle = () => {
        switch(post.type) {
            case 'alert': return 'bg-red-50 text-red-600 border-red-200';
            case 'educational': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            default: return 'bg-blue-50 text-blue-700 border-blue-200';
        }
    };

    return (
        <>
            {/* Tarjeta Resumen */}
            <div 
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group flex flex-col h-full"
                onClick={() => setIsExpanded(true)}
            >
                {post.image_url && (
                    <div className="h-48 overflow-hidden relative">
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10" />
                        <img 
                            src={mediaUrl(post.image_url)} 
                            alt="" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                    </div>
                )}
                
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getBadgeStyle()}`}>
                            {getIcon()}
                            {post.type}
                        </span>
                        <span className="text-xs font-medium text-slate-400">{date}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                        {post.title}
                    </h3>
                    
                    <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-1">
                        {post.content}
                    </p>

                    {/* Indicadores de media */}
                    {(post.video_url || post.audio_url || post.file_url || post.link_url) && (
                        <div className="flex gap-2 mb-3 flex-wrap">
                            {post.video_url && (
                                <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-100">
                                    🎬 Video
                                </span>
                            )}
                            {post.audio_url && (
                                <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                                    🎵 Audio
                                </span>
                            )}
                            {post.file_url && (
                                <span className="inline-flex items-center gap-1 text-xs bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                                    📄 Archivo
                                </span>
                            )}
                            {post.link_url && (
                                <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">
                                    🔗 Enlace
                                </span>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100" onClick={e => e.stopPropagation()}>
                        <EmojiReactions postId={post._id || post.id} />
                        <button className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-600 transition-colors text-sm font-medium">
                            <MessageCircle size={18} />
                            Comentar
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de Detalle Expandido */}
            {isExpanded && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsExpanded(false)} />
                    
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col animate-slide-in">
                        <button 
                            onClick={() => setIsExpanded(false)}
                            className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="overflow-y-auto custom-scrollbar flex-1">
                            {post.image_url && (
                                <img 
                                    src={mediaUrl(post.image_url)} 
                                    alt="" 
                                    className="w-full h-64 md:h-96 object-cover"
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            )}
                            
                            <div className="p-6 md:p-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold uppercase border ${getBadgeStyle()}`}>
                                        {getIcon()}
                                        {post.type}
                                    </span>
                                    <span className="text-slate-500 font-medium">{date}</span>
                                </div>
                                
                                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">{post.title}</h2>
                                
                                <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed text-lg mb-10">
                                    {post.content}
                                </div>

                                {/* Video */}
                                {post.video_url && (
                                    <div className="mb-8">
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            🎬 Video
                                        </h4>
                                        {post.video_url.includes('youtube.com') || post.video_url.includes('youtu.be') ? (
                                            <iframe 
                                                className="w-full aspect-video rounded-2xl shadow-lg" 
                                                src={`https://www.youtube.com/embed/${post.video_url.includes('youtu.be') ? post.video_url.split('youtu.be/')[1]?.split('?')[0] : post.video_url.split('v=')[1]?.split('&')[0]}`} 
                                                allowFullScreen
                                            />
                                        ) : (
                                            <video 
                                                className="w-full aspect-video rounded-2xl shadow-lg bg-black" 
                                                controls 
                                                src={mediaUrl(post.video_url)}
                                                preload="metadata"
                                            >
                                                Tu navegador no soporta la reproducción de video.
                                            </video>
                                        )}
                                    </div>
                                )}

                                {/* Audio */}
                                {post.audio_url && (
                                    <div className="mb-8 p-5 bg-blue-50 rounded-2xl border border-blue-100">
                                        <h4 className="text-sm font-bold text-blue-700 mb-3 flex items-center gap-2">
                                            <Music size={16} /> {post.audio_name || 'Audio adjunto'}
                                        </h4>
                                        <audio 
                                            controls 
                                            className="w-full"
                                            src={mediaUrl(post.audio_url)}
                                        >
                                            Tu navegador no soporta la reproducción de audio.
                                        </audio>
                                    </div>
                                )}

                                {/* Archivo descargable */}
                                {post.file_url && (
                                    <div className="mb-8">
                                        <a 
                                            href={mediaUrl(post.file_url)} 
                                            download={post.file_name || true}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-3 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors border border-slate-200"
                                        >
                                            <Download size={18} />
                                            {post.file_name || 'Descargar archivo adjunto'}
                                        </a>
                                    </div>
                                )}

                                {/* Enlace externo */}
                                {post.link_url && (
                                    <div className="mb-8">
                                        <a 
                                            href={post.link_url} 
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-3 px-5 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-xl transition-colors border border-emerald-200"
                                        >
                                            <ExternalLink size={18} />
                                            {post.link_title || post.link_url}
                                        </a>
                                    </div>
                                )}

                                {/* Tags */}
                                {post.tags && post.tags.length > 0 && (
                                    <div className="mb-8 flex flex-wrap gap-2">
                                        {post.tags.map((tag: string, i: number) => (
                                            <span key={`tag-${i}-${tag}`} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="border-t border-slate-200 pt-6">
                                    <div className="mb-8">
                                        <EmojiReactions postId={post._id || post.id} />
                                    </div>
                                    
                                    <PostSurvey postId={post._id || post.id} />
                                    
                                    <PostComments postId={post._id || post.id} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
