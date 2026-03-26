'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Cliente {
  id: number;
  nombre: string;
  tipo: string;
  tipoDocumento: number;
  numeroDocumento: string;
  razonSocial: string;
  pais: string;
  moneda: string;
  tipoFactura: string;
  createdAt: string;
}

const TIPOS = [
  { value: 'streaming', label: 'Plataforma Streaming', icon: '🎮' },
  { value: 'sponsor-ri', label: 'Sponsor Empresa', icon: '🏢' },
  { value: 'sponsor-consumidor', label: 'Sponsor Consumidor', icon: '👤' },
  { value: 'general', label: 'Cliente General', icon: '🔧' },
];

export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('streaming');
  const [tipoDocumento, setTipoDocumento] = useState('80');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [pais, setPais] = useState('US');
  const [moneda, setMoneda] = useState('USD');

  useEffect(() => {
    fetch('/api/clientes')
      .then((res) => {
        if (!res.ok) throw new Error('No autorizado');
        return res.json();
      })
      .then((data) => setClientes(data.clientes || []))
      .catch(() => setError('Error al cargar clientes'))
      .finally(() => setLoading(false));
  }, []);

  const getTipoLabel = (tipo: string) => {
    return TIPOS.find(t => t.value === tipo)?.label || tipo;
  };

  const getTipoIcon = (tipo: string) => {
    return TIPOS.find(t => t.value === tipo)?.icon || '👤';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const tipoObj = TIPOS.find(t => t.value === tipo);
      const tipoFactura = tipo === 'streaming' ? 'E' : tipo === 'sponsor-ri' ? 'A' : tipo === 'sponsor-consumidor' ? 'B' : 'C';

      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          tipo,
          tipoDocumento: parseInt(tipoDocumento),
          numeroDocumento,
          razonSocial,
          pais,
          moneda,
          tipoFactura,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al guardar');
        return;
      }

      // Agregar cliente a la lista
      setClientes([data.cliente, ...clientes]);
      
      // Limpiar form
      setNombre('');
      setTipo('streaming');
      setTipoDocumento('80');
      setNumeroDocumento('');
      setRazonSocial('');
      setPais('US');
      setMoneda('USD');
      setShowForm(false);
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este cliente?')) return;

    try {
      const res = await fetch(`/api/clientes?id=${id}`, { method: 'DELETE' });
      
      if (res.ok) {
        setClientes(clientes.filter(c => c.id !== id));
      }
    } catch {
      setError('Error al eliminar');
    }
  };

  if (loading) return <div className="text-center py-8">Cargando...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard" className="text-blue-800 hover:underline">
          ← Volver
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">👥 Mis Clientes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900"
        >
          {showForm ? 'Cancelar' : '+ Agregar Cliente'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold mb-4">Agregar Cliente</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del cliente
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Twitch Argentina"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {TIPOS.map(t => (
                    <option key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Campos según tipo */}
            {tipo === 'streaming' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                  <select
                    value={pais}
                    onChange={(e) => setPais(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="US">Estados Unidos</option>
                    <option value="UK">Reino Unido</option>
                    <option value="DE">Alemania</option>
                    <option value="ES">España</option>
                    <option value="BR">Brasil</option>
                    <option value="AR">Argentina</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                  <select
                    value={moneda}
                    onChange={(e) => setMoneda(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="ARS">ARS</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
                  <input
                    type="text"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    placeholder="Twitch Interactive Inc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            )}

            {(tipo === 'sponsor-ri' || tipo === 'sponsor-consumidor') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Documento</label>
                  <select
                    value={tipoDocumento}
                    onChange={(e) => setTipoDocumento(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="80">CUIT</option>
                    <option value="96">DNI</option>
                    <option value="86">CUIL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                  <input
                    type="text"
                    value={numeroDocumento}
                    onChange={(e) => setNumeroDocumento(e.target.value.replace(/\D/g, ''))}
                    placeholder={tipoDocumento === '80' ? '20123456789' : '12345678'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
                  <input
                    type="text"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    placeholder="Empresa S.A."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 px-4 bg-blue-800 text-white rounded-lg hover:bg-blue-900 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Cliente'}
            </button>
          </form>
        </div>
      )}

      {/* Lista de clientes */}
      {clientes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">No tenés clientes guardados</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-blue-800 hover:underline"
          >
            Agregar primer cliente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clientes.map((cliente) => (
            <div key={cliente.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{getTipoIcon(cliente.tipo)}</span>
                    <h3 className="font-semibold">{cliente.nombre}</h3>
                  </div>
                  <p className="text-sm text-gray-500">{getTipoLabel(cliente.tipo)}</p>
                  <div className="mt-2 text-sm text-gray-600">
                    {cliente.tipoFactura === 'E' && (
                      <span>🌍 {cliente.pais} · {cliente.moneda}</span>
                    )}
                    {cliente.numeroDocumento && (
                      <span>📄 {cliente.numeroDocumento}</span>
                    )}
                  </div>
                  {cliente.razonSocial && (
                    <p className="text-sm text-gray-500 mt-1">{cliente.razonSocial}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(cliente.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}