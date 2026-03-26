'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Nota {
  id: number;
  numero: number;
  tipo: string;
  tipoLetra: string;
  monto: number;
  montoNeto: number;
  montoIVA: number;
  motivo: string;
  cae: string;
  caeVencimiento: string;
  createdAt: string;
}

export default function NotasPage() {
  const router = useRouter();
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<any>(null);
  
  // Form state
  const [tipo, setTipo] = useState('credito');
  const [tipoFactura, setTipoFactura] = useState('C');
  const [monto, setMonto] = useState('');
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    fetch('/api/notas')
      .then((res) => {
        if (!res.ok) throw new Error('No autorizado');
        return res.json();
      })
      .then((data) => setNotas(data.notas || []))
      .catch(() => setError('Error al cargar notas'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/notas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          tipoFactura,
          monto: parseFloat(monto),
          motivo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al crear');
        return;
      }

      setResultado(data.nota);
      setNotas([data.nota, ...notas]);
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-bold">📄 Notas de Crédito / Débito</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900"
        >
          {showForm ? 'Cancelar' : '+ Nueva Nota'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}

      {/* Resultado */}
      {resultado && (
        <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Nota Generada</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Número: <strong>{resultado.numero}</strong></div>
            <div>Tipo: <strong>{resultado.tipo}</strong></div>
            <div>CAE: <strong>{resultado.cae}</strong></div>
            <div>Monto: <strong>${resultado.monto}</strong></div>
          </div>
          <button
            onClick={() => { setResultado(null); setShowForm(false); }}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Aceptar
          </button>
        </div>
      )}

      {/* Formulario */}
      {showForm && !resultado && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold mb-4">Nueva Nota</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Nota</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="credito">📝 Nota de Crédito (devolución)</option>
                  <option value="debito">💰 Nota de Débito (recargo)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Factura</label>
                <select
                  value={tipoFactura}
                  onChange={(e) => setTipoFactura(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="C">C - Monotributista</option>
                  <option value="B">B - Consumidor Final</option>
                  <option value="A">A - Responsable Inscripto</option>
                  <option value="E">E - Exportación</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <select
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">-- Seleccionar motivo --</option>
                  <option value="devolucion">Devolución de dinero</option>
                  <option value="descuento">Descuento por volumen</option>
                  <option value="ajuste">Ajuste de precio</option>
                  <option value="recargo">Recargo</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 px-4 bg-blue-800 text-white rounded-lg hover:bg-blue-900 disabled:opacity-50"
            >
              {saving ? 'Generando...' : 'Generar Nota'}
            </button>
          </form>
        </div>
      )}

      {/* Lista */}
      {notas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">No tenés notas emitidas</p>
          <button onClick={() => setShowForm(true)} className="text-blue-800 hover:underline">
            Crear primera nota
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Número</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tipo</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Motivo</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Monto</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">CAE</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {notas.map((nota) => (
                <tr key={nota.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">
                    {nota.numero.toString().padStart(8, '0')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded ${
                      nota.tipo === 'credito' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {nota.tipo === 'credito' ? 'Crédito' : 'Débito'} {nota.tipoLetra}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm capitalize">{nota.motivo}</td>
                  <td className="px-4 py-3 text-sm font-medium">${nota.monto.toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs font-mono">{nota.cae}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(nota.createdAt).toLocaleDateString('es-AR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}