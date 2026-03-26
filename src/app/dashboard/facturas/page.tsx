'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Factura {
  id: number;
  numero: number;
  tipoLetra: string;
  monto: number;
  montoNeto: number;
  montoIVA: number;
  clienteRazonSocial: string;
  cae: string | null;
  caeVencimiento: string | null;
  resultado: string | null;
  createdAt: string;
}

export default function FacturasPage() {
  const router = useRouter();
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/facturas/nueva')
      .then((res) => {
        if (!res.ok) throw new Error('No autorizado');
        return res.json();
      })
      .then((data) => setFacturas(data.facturas || []))
      .catch(() => setError('Error al cargar facturas'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8">Cargando...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard" className="text-blue-800 hover:underline">
          ← Volver
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📋 Historial de Facturas</h1>
        <Link
          href="/dashboard/facturar"
          className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900"
        >
          Nueva Factura
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">{error}</div>
      )}

      {facturas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">No tenés facturas emitidas todavía</p>
          <Link
            href="/dashboard/facturar"
            className="text-blue-800 hover:underline"
          >
            Emitir primera factura
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Número</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tipo</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Neto</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">IVA</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Total</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">CAE</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {facturas.map((factura) => (
                <tr key={factura.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">
                    {factura.numero.toString().padStart(8, '0')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                      factura.tipoLetra === 'A' ? 'bg-blue-100 text-blue-800' :
                      factura.tipoLetra === 'B' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {factura.tipoLetra}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm max-w-[150px] truncate" title={factura.clienteRazonSocial}>
                    {factura.clienteRazonSocial}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    ${factura.montoNeto.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    ${factura.montoIVA.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    ${factura.monto.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-xs max-w-[100px] truncate" title={factura.cae || ''}>
                    {factura.cae || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(factura.createdAt).toLocaleDateString('es-AR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Resumen */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Total Facturado</div>
          <div className="text-2xl font-bold">
            ${facturas.reduce((sum, f) => sum + f.monto, 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">IVA Cobrado</div>
          <div className="text-2xl font-bold">
            ${facturas.reduce((sum, f) => sum + f.montoIVA, 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Total Facturas</div>
          <div className="text-2xl font-bold">{facturas.length}</div>
        </div>
      </div>
    </div>
  );
}