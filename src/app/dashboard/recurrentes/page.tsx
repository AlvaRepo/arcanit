'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Cliente {
  id: number;
  nombre: string;
  tipoFactura: string;
  razonSocial: string;
}

interface Recurrente {
  id: number;
  clienteId: number;
  clienteNombre: string;
  monto: number;
  tipoFactura: string;
  frecuencia: string;
  proximaFecha: string;
  activa: boolean;
}

const FRECUENCIAS = [
  { value: 'semanal', label: 'Semanal', desc: 'Cada 7 días' },
  { value: 'quincenal', label: 'Quincenal', desc: 'Cada 15 días' },
  { value: 'mensual', label: 'Mensual', desc: 'Cada 30 días' },
];

export default function RecurrentesPage() {
  const router = useRouter();
  const [recurrentes, setRecurrentes] = useState<Recurrente[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [clienteId, setClienteId] = useState('');
  const [monto, setMonto] = useState('');
  const [frecuencia, setFrecuencia] = useState('mensual');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    Promise.all([
      fetch('/api/recurrentes').then(r => r.json()),
      fetch('/api/clientes').then(r => r.json())
    ])
      .then(([recData, clientesData]) => {
        setRecurrentes(recData.recurrentes || []);
        setClientes(clientesData.clientes || []);
      })
      .catch(() => setError('Error al cargar datos'))
      .finally(() => setLoading(false));
  }, []);

  const getFrecuenciaLabel = (f: string) => {
    return FRECUENCIAS.find(freq => freq.value === f)?.label || f;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const cliente = clientes.find(c => c.id === parseInt(clienteId));
      
      const res = await fetch('/api/recurrentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: clienteId ? parseInt(clienteId) : 0,
          clienteNombre: cliente?.nombre || 'Cliente general',
          monto: parseFloat(monto),
          tipoFactura: cliente?.tipoFactura || 'C',
          frecuencia,
          fechaInicio,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al guardar');
        return;
      }

      setRecurrentes([data.recurrente, ...recurrentes]);
      setShowForm(false);
      setMonto('');
      setFrecuencia('mensual');
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: number, activa: boolean) => {
    try {
      const res = await fetch('/api/recurrentes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, activa: !activa }),
      });

      if (res.ok) {
        setRecurrentes(recurrentes.map(r => 
          r.id === id ? { ...r, activa: !activa } : r
        ));
      }
    } catch {
      setError('Error al actualizar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta facturación recurrente?')) return;

    try {
      const res = await fetch(`/api/recurrentes?id=${id}`, { method: 'DELETE' });
      
      if (res.ok) {
        setRecurrentes(recurrentes.filter(r => r.id !== id));
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
        <h1 className="text-2xl font-bold">🔄 Facturación Recurrente</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900"
        >
          {showForm ? 'Cancelar' : '+ Nueva Recurrente'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold mb-4">Nueva Facturación Recurrente</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente (opcional)
                </label>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">-- Cliente general --</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.tipoFactura})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frecuencia
                </label>
                <select
                  value={frecuencia}
                  onChange={(e) => setFrecuencia(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {FRECUENCIAS.map(f => (
                    <option key={f.value} value={f.value}>
                      {f.label} - {f.desc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="10000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primera fecha
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
              <p className="font-medium">📝 Info:</p>
              <p>Se generará una factura automáticamente cada vez que vence el período.</p>
              <p>Por ahora, las facturas se generan de forma manual (simulada).</p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 px-4 bg-blue-800 text-white rounded-lg hover:bg-blue-900 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Crear Recurrente'}
            </button>
          </form>
        </div>
      )}

      {/* Lista */}
      {recurrentes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">No tenés facturaciones recurrentes</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-blue-800 hover:underline"
          >
            Crear primera recurrencia
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {recurrentes.map((r) => (
            <div key={r.id} className={`bg-white p-4 rounded-lg shadow border ${
              r.activa ? 'border-gray-200' : 'border-gray-300 opacity-60'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{r.clienteNombre}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      r.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {r.activa ? 'Activa' : 'Pausada'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {getFrecuenciaLabel(r.frecuencia)} · Factura {r.tipoFactura}
                  </p>
                  <p className="text-lg font-bold mt-2">
                    ${r.monto.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Próxima: {new Date(r.proximaFecha).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(r.id, r.activa)}
                    className={`px-3 py-1 text-sm rounded ${
                      r.activa 
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {r.activa ? 'Pausar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
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