import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FactuARCA - Facturación Electrónica Argentina',
  description: 'Sistema de facturación electrónica ARCA para monotributistas y responsables inscriptos argentinos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-blue-800 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold">FactuARCA</h1>
              <p className="text-sm text-blue-200">Facturación Electrónica Argentina</p>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}