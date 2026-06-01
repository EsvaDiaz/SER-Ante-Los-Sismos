"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';

interface SlidePost {
  id?: number;
  title: string;
  content: string;
  type: string;
  created_at: string;
  image_url?: string;
  _isExample?: boolean;
}

// Noticias de ejemplo (se muestran si no hay posts reales del backend)
const EXAMPLE_SLIDES: SlidePost[] = [
  {
    id: 1,
    title: "Sismo de magnitud 3.2 sacude el Oriente de Cuba",
    content: "Un temblor de magnitud 3.2 fue registrado esta madrugada en la región oriental de Cuba. El CENAIS confirmó el epicentro a 12 km al sur de Santiago de Cuba con una profundidad de 10 km.",
    type: "alert",
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    image_url: "/news_sismo_cuba.png",
    _isExample: true,
  },
  {
    id: 2,
    title: "El CENAIS realiza pruebas en la red de monitoreo sísmico nacional",
    content: "El Centro Nacional de Investigaciones Sismológicas realizó pruebas de monitoreo en zonas de alta actividad tectónica, ampliando la cobertura a todo el territorio nacional.",
    type: "news",
    created_at: new Date(Date.now() - 26 * 3600000).toISOString(),
    image_url: "/news_equipo_cenais.png",
    _isExample: true,
  },
  {
    id: 3,
    title: "Simulacros nacionales de evacuación sísmica en La Habana",
    content: "Los ciudadanos participan frecuentemente en un simulacro de evacuación organizado por la Defensa Civil. El ejercicio evalúa tiempos de respuesta y rutas de evacuación en los principales municipios capitalinos.",
    type: "educational",
    created_at: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    image_url: "/news_simulacro.png",
    _isExample: true,
  },
];

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  alert:       { label: "🚨 Alerta",        cls: "bg-red-500/80 text-white" },
  news:        { label: "📡 Noticia",        cls: "bg-blue-500/80 text-white" },
  educational: { label: "📚 Educativo",      cls: "bg-emerald-500/80 text-white" },
  default:     { label: "📰 Publicación",    cls: "bg-slate-600/80 text-white" },
};

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "Hace menos de 1h";
  if (h < 24) return `Hace ${h}h`;
  const d = Math.floor(h / 24);
  return `Hace ${d} día${d > 1 ? 's' : ''}`;
}

export default function HeroSlider() {
  const [slides, setSlides] = useState<SlidePost[]>(EXAMPLE_SLIDES);
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [animating, setAnimating] = useState(false);

  // Intentar cargar posts reales del backend
  useEffect(() => {
    fetchAPI('/posts?limit=3')
      .then((posts: any[]) => {
        if (posts && posts.length >= 1) {
          // Rellenar con ejemplos si hay menos de 3
          const filled = [...posts, ...EXAMPLE_SLIDES].slice(0, 3);
          setSlides(filled);
        }
      })
      .catch(() => { /* usa ejemplos */ });
  }, []);

  const goTo = useCallback((idx: number) => {
    if (animating) return;
    setAnimating(true);
    setCurrent(idx);
    setTimeout(() => setAnimating(false), 500);
  }, [animating]);

  const next = useCallback(() => goTo((current + 1) % slides.length), [current, slides.length, goTo]);
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, slides.length, goTo]);

  // Auto-avance cada 5 s cuando no hay hover
  useEffect(() => {
    if (isHovered) return;
    const t = setTimeout(next, 5000);
    return () => clearTimeout(t);
  }, [isHovered, current, next]);

  const slide = slides[current];
  const badge = TYPE_BADGE[slide.type] ?? TYPE_BADGE.default;
  const href = slide._isExample ? '/alertas' : `/alertas?post=${slide.id}`;

  return (
    <section className="px-6 pb-8 -mt-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Label */}
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-400 inline-block" />
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
            Últimas Publicaciones
          </span>
        </div>

        {/* Slider card */}
        <div
          className="relative rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/10 border border-slate-200/60 cursor-pointer group"
          style={{ height: '360px' }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Background images (all stacked, faded in/out) */}
          {slides.map((s, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: i === current ? 1 : 0 }}
            >
              {/* Imagen con opacidad ~0.50 */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${s.image_url ?? '/news_sismo_cuba.png'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.50,
                }}
              />
              {/* Gradiente oscuro sobre la imagen */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/50 to-slate-900/20" />
            </div>
          ))}

          {/* Content — clickable */}
          <Link href={href} className="absolute inset-0 flex flex-col justify-end p-8 z-10">
            <div
              className="transition-all duration-500"
              style={{ transform: animating ? 'translateY(8px)' : 'translateY(0)', opacity: animating ? 0 : 1 }}
            >
              {/* Badge + date */}
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${badge.cls}`}>
                  {badge.label}
                </span>
                <span className="text-slate-300 text-xs">{formatRelative(slide.created_at)}</span>
              </div>

              {/* Title */}
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-3 drop-shadow-lg max-w-2xl">
                {slide.title}
              </h2>

              {/* Excerpt */}
              <p className="text-slate-300 text-sm leading-relaxed max-w-xl line-clamp-2">
                {slide.content}
              </p>

              {/* CTA */}
              <div className="mt-4 inline-flex items-center gap-2 text-emerald-400 text-sm font-semibold group-hover:gap-3 transition-all duration-300">
                <span>Leer más</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Prev / Next arrows */}
          <button
            onClick={(e) => { e.preventDefault(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white transition opacity-0 group-hover:opacity-100"
            aria-label="Anterior"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.preventDefault(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white transition opacity-0 group-hover:opacity-100"
            aria-label="Siguiente"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Thumbnail strip */}
          <div className="absolute bottom-4 right-6 z-20 flex items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); goTo(i); }}
                className={`relative rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                  i === current ? 'border-emerald-400 scale-110 shadow-lg shadow-emerald-500/40' : 'border-white/20 opacity-50 hover:opacity-80'
                }`}
                style={{ width: 52, height: 36 }}
                aria-label={`Ir a noticia ${i + 1}`}
              >
                <div
                  style={{
                    backgroundImage: `url(${s.image_url ?? '/news_sismo_cuba.png'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    width: '100%',
                    height: '100%',
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
