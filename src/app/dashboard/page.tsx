'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  nombre: string;
  email: string;
  configCompleta: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ahora usamos la cookie de sesión (no necesitamos header extra)
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('No autorizado');
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        // Si no tiene config completa, redirigir a configuración
        if (!data.user.configCompleta) {
          router.push('/dashboard/configuracion');
        }
      })
      .catch(() => {
        router.push('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Hola, {user.nombre}
          </h1>
          <p className="text-gray-600">Bienvenido a ArcaNit</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Estado de configuración */}
      {!user.configCompleta && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p className="text-yellow-800">
            ⚠️ Completá tu configuración para poder facturar
          </p>
          <Link 
            href="/dashboard/configuracion" 
            className="text-yellow-600 underline hover:text-yellow-800"
          >
            Ir a configuración
          </Link>
        </div>
      )}

      {/* Acciones principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Nueva Factura */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">📝 Nueva Factura</h2>
          <p className="text-gray-600 mb-4">
            Emití una nueva factura electrónica
          </p>
          <Link
            href="/dashboard/facturar"
            className="inline-block px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900"
          >
            Ir a Facturar
          </Link>
        </div>

        {/* Clientes */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">👥 Clientes</h2>
          <p className="text-gray-600 mb-4">
            Gestionar clientes frecuentes
          </p>
          <Link
            href="/dashboard/clientes"
            className="inline-block px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900"
          >
            Ver Clientes
          </Link>
        </div>

        {/* Historial */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">📋 Historial</h2>
          <p className="text-gray-600 mb-4">
            Ver todas las facturas emitidas
          </p>
          <Link
            href="/dashboard/facturas"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Ver Historial
          </Link>
        </div>

        {/* Configuración */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">⚙️ Configuración</h2>
          <p className="text-gray-600 mb-4">
            Gestionar CUIT, punto de venta
          </p>
          <Link
            href="/dashboard/configuracion"
            className="inline-block px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Configurar
          </Link>
        </div>

        {/* Recurrentes */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">🔄 Recurrentes</h2>
          <p className="text-gray-600 mb-4">
            Facturas automáticas semanales/mensuales
          </p>
          <Link
            href="/dashboard/recurrentes"
            className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Ver Recurrentes
          </Link>
        </div>

        {/* Notas */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">📄 Notas</h2>
          <p className="text-gray-600 mb-4">
            Notas de crédito y débito
          </p>
          <Link
            href="/dashboard/notas"
            className="inline-block px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Ver Notas
          </Link>
        </div>
      </div>
    </div>
  );
}