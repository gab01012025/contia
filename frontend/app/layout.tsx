import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CONTIA - Trámites contables y laborales asistidos por IA',
  description:
    'Plataforma profesional para certificación de ingresos, IVA y prestaciones sociales (LOTTT Venezuela).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
