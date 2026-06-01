import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import FloatingChat from "@/components/FloatingChat";

export const metadata: Metadata = {
  title: "SER Cuba | Reporte Sísmico y Alertas",
  description: "Plataforma oficial de monitoreo sísmico en tiempo real, alertas tempranas y asistencia con IA para la protección ciudadana en Cuba.",
  keywords: ["sismos cuba", "terremoto", "cenais", "alerta sísmica", "protección civil", "santiago de cuba", "granma"],
  authors: [{ name: "SER Cuba Team" }],
  openGraph: {
    title: "SER Cuba - Sistema de Reporte Sísmico",
    description: "Monitoreo en tiempo real y asistente inteligente para la gestión de riesgos sísmicos.",
    type: "website",
    locale: "es_CU",
    siteName: "SER Cuba",
  },
  twitter: {
    card: "summary_large_image",
    title: "SER Cuba - Alertas Sísmicas",
    description: "Mantente informado y seguro con reportes validados por CENAIS e IA.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <Navbar />
        {children}
        <FloatingChat />
      </body>
    </html>
  );
}
