'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UserConfig {
  id: number;
  nombre: string;
  email: string;
  cuit: string | null;
  puntoVenta: number | null;
  configCompleta: boolean;
}

// Función para obtener headers con device ID
const getAuthHeaders = () => {
  if (typeof window === 'undefined') return {};
  const userId = localStorage.getItem('arcanit-user-id');
  const deviceId = localStorage.getItem('arcanit-device-id');
  const headers: Record<string, string> = {};
  if (userId) headers['x-user-id'] = userId;
  if (deviceId) headers['x-device-id'] = deviceId;
  return headers;
};

export default function ConfiguracionPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form state
  const [cuit, setCuit] = useState('');
  const [puntoVenta, setPuntoVenta] = useState('');
  const [certificado, setCertificado] = useState<File | null>(null);
  const [clavePrivada, setClavePrivada] = useState<File | null>(null);

  useEffect(() => {
    // Usar cookie de sesión directamente
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('No autorizado');
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        if (data.user.cuit) setCuit(data.user.cuit);
        if (data.user.puntoVenta) setPuntoVenta(String(data.user.puntoVenta));
      })
      .catch(() => {
        router.push('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('cuit', cuit);
      formData.append('puntoVenta', puntoVenta);
      if (certificado) formData.append('certificado', certificado);
      if (clavePrivada) formData.append('clavePrivada', clavePrivada);

      const res = await fetch('/api/usuario/config', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Error al guardar' });
        return;
      }

      setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
      
      // Recargar datos del usuario
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      setUser(userData.user);

    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">⚙️ Configuración</h1>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <p className="text-gray-600 mb-6">
          Completá los datos de tu cuenta para poder emitir facturas electrónicas.
        </p>

        {message.text && (
          <div className={`mb-4 p-4 rounded ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CUIT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CUIT (sin guiones)
            </label>
            <input
              type="text"
              value={cuit}
              onChange={(e) => setCuit(e.target.value.replace(/\D/g, ''))}
              placeholder="20123456789"
              maxLength={11}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-arca-primary focus:border-arca-primary"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Tu Clave Única de Identificación Tributara (ej: 20-12345678-9)
            </p>
          </div>

          {/* Punto de Venta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Punto de Venta
            </label>
            <input
              type="number"
              value={puntoVenta}
              onChange={(e) => setPuntoVenta(e.target.value)}
              placeholder="1"
              min={1}
              max={99999}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-arca-primary focus:border-arca-primary"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Número de punto de venta habilitado para facturación electrónica
            </p>
          </div>

          {/* Certificado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Certificado Digital (.crt)
            </label>
            <input
              type="file"
              accept=".crt,.pem,.cer"
              onChange={(e) => setCertificado(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              Certificado digital emitido por ARCA para facturación electrónica
            </p>
          </div>

          {/* Clave Privada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clave Privada (.key)
            </label>
            <input
              type="file"
              accept=".key"
              onChange={(e) => setClavePrivada(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              Clave privada asociada al certificado
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 px-4 bg-arca-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </form>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">📝 ¿Cómo obtener los certificados?</h3>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Ingresá a <a href="https://www.afip.gob.ar/" target="_blank" className="underline">ARCA</a> con tu Clave Fiscal</li>
          <li>Buscá "Administración de Certificados" en el menú de servicios</li>
          <li>Solicitá un certificado de firma digital</li>
          <li>Descargá el certificado (.crt) y la clave privada (.key)</li>
        </ol>
      </div>
    </div>
  );
}