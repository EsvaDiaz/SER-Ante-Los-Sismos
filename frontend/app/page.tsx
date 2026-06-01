import Link from 'next/link';
import EarthquakeTicker from '@/components/EarthquakeTicker';
import CommentsSection from '@/components/CommentsSection';
import NewsSection from '@/components/NewsSection';
import HeroSlider from '@/components/HeroSlider';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <EarthquakeTicker />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        <div 
          className="absolute inset-0 z-0 opacity-[0.20] mix-blend-multiply pointer-events-none" 
          style={{ backgroundImage: 'url(/cuba_seismic_bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} 
        />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 relative z-10">
          <div className="flex-1 text-center md:text-left z-10">
            <div className="inline-block px-3 py-1 mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-medium text-sm">
              Monitoreo Sísmico en Tiempo Real
            </div>
            <h2 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              Mantente <span className="text-gradient">Alerta</span>, <br />
              Mantente Seguro.
            </h2>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl">
              Información sísmica precisa del CENAIS, potenciada con Inteligencia Artificial para tu seguridad.
              Recibe alertas, análisis y recomendaciones personalizadas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link href="/alertas" className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 transition shadow-lg shadow-emerald-500/25 text-white font-semibold text-lg">
                Ver Sismos Recientes
              </Link>
              <Link href="/chat" className="px-8 py-3 rounded-xl glass-panel text-slate-700 hover:bg-emerald-50/50 transition font-semibold text-lg flex items-center justify-center gap-2">
                <span>Consultar IA</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </Link>
            </div>
          </div>

          <div className="flex-1 relative w-full h-[400px] flex items-center justify-center">
            {/* Globo Abstracto/Marcador de Animación del Mapa */}
            <div className="relative w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl animate-pulse absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
            <div className="glass-panel p-6 rounded-2xl md:absolute md:right-0 md:top-10 max-w-sm w-full animate-float">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Estado del Sistema
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Estado Alerta</span>
                  <span className="text-emerald-600 font-medium">Normal</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Último Evento</span>
                  <span className="text-slate-800 font-medium">Hace 11h</span>
                </div>
                <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 w-[20%] animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HeroSlider />

      {/* Grid de Características */}
      <section className="py-20 px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Nuestro Bot", desc: "Recibe notificaciones instantáneas en tu dispositivo móvil. Alertas a través de Telegram.", icon: "📱", dest: "https://t.me/ser_alertsbot", external: true },
            { title: "IA Avanzada", desc: "Consultas respondidas por Ollama con contexto personalizado.", icon: "🤖", dest: "/chat", external: false },
            { title: "Datos CENAIS", desc: "Sincronización directa con el Centro Nacional de Investigaciones.", icon: "📡", dest: "http://www.cenais.gob.cu/", external: true },
          ].map((feature, i) => {
            const CardContent = (
              <div className="glass-panel p-8 rounded-2xl hover:scale-105 transition duration-300 h-full cursor-pointer">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2 text-slate-800">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </div>
            );

            return feature.external ? (
              <a key={i} href={feature.dest} target="_blank" rel="noopener noreferrer" className="block">
                {CardContent}
              </a>
            ) : (
              <Link key={i} href={feature.dest} className="block">
                {CardContent}
              </Link>
            )
          })}
        </div>
      </section>

      <NewsSection />

      <CommentsSection />

      <footer className="mt-auto border-t border-slate-200 py-8 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} SER Cuba. Desarrollado para la protección ciudadana.</p>
      </footer>
    </main>
  );
}
