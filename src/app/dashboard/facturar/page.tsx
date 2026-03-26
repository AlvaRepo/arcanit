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

interface FacturaResult {
  numero: number;
  tipo: string;
  cae: string;
  caeVencimiento: string;
  resultado: string;
  monto: number;
}

interface Preset {
  id: string;
  label: string;
  icon: string;
  descripcion: string;
  tipoFactura: string;
  necesitaCliente: boolean;
}

// Presets para streamers
const PRESETS: Preset[] = [
  {
    id: 'streaming',
    label: 'Plataforma Streaming',
    icon: '🎮',
    descripcion: 'Twitch, Kick, YouTube (exterior)',
    tipoFactura: 'E',
    necesitaCliente: true,
  },
  {
    id: 'sponsor-ri',
    label: 'Sponsor Argentina (Empresa)',
    icon: '🏢',
    descripcion: 'Empresa argentina (RI)',
    tipoFactura: 'A',
    necesitaCliente: true,
  },
  {
    id: 'sponsor-consumidor',
    label: 'Sponsor Consumidor',
    icon: '👤',
    descripcion: 'Persona física argentina',
    tipoFactura: 'B',
    necesitaCliente: true,
  },
  {
    id: 'servicio-general',
    label: 'Servicio General',
    icon: '🔧',
    descripcion: 'Servicio a consumidor final',
    tipoFactura: 'C',
    necesitaCliente: false,
  },
];

export default function FacturarPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Clientes guardados
  const [clientes, setClientes] = useState<any[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<number | null>(null);
  
  // Form state
  const [preset, setPreset] = useState('streaming');
  const [monto, setMonto] = useState('');
  const [tipoFactura, setTipoFactura] = useState('E');
  const [clienteDocTipo, setClienteDocTipo] = useState('80');
  const [clienteDocNro, setClienteDocNro] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clientePais, setClientePais] = useState('US');
  const [moneda, setMoneda] = useState('USD');
  const [facturando, setFacturando] = useState(false);
  const [resultado, setResultado] = useState<FacturaResult | null>(null);
  const [error, setError] = useState('');

  // Obtener preset seleccionado
  const presetActual = PRESETS.find(p => p.id === preset)!;

  useEffect(() => {
    // Cargar datos del usuario y clientes
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/clientes').then(r => r.json())
    ])
      .then(([userData, clientesData]) => {
        setUser(userData.user);
        setClientes(clientesData.clientes || []);
        if (!userData.user?.configCompleta) {
          router.push('/dashboard/configuracion');
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  // Cuando selecciona un cliente, autocompletar los datos
  useEffect(() => {
    if (clienteSeleccionado) {
      const cliente = clientes.find(c => c.id === clienteSeleccionado);
      if (cliente) {
        setClienteNombre(cliente.razonSocial || cliente.nombre);
        setClienteDocTipo(String(cliente.tipoDocumento));
        setClienteDocNro(cliente.numeroDocumento);
        setClientePais(cliente.pais);
        setMoneda(cliente.moneda);
        // Seleccionar el preset correcto
        const presetMatch = PRESETS.find(p => p.tipoFactura === cliente.tipoFactura);
        if (presetMatch) {
          setPreset(presetMatch.id);
        }
      }
    }
  }, [clienteSeleccionado, clientes]);

  // Actualizar tipo de factura cuando cambia el preset
  useEffect(() => {
    setTipoFactura(presetActual.tipoFactura);
  }, [preset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!monto || parseFloat(monto) <= 0) {
      setError('Ingrese un monto válido');
      return;
    }

    // Validaciones según tipo de factura
    if (tipoFactura === 'A' && (!clienteDocNro || clienteDocNro.length !== 11)) {
      setError('Para Factura A debe ingresar CUIT del cliente (11 dígitos)');
      return;
    }

    if (tipoFactura === 'E' && !clientePais) {
      setError('Para Factura E debe seleccionar el país del cliente');
      return;
    }

    setError('');
    setResultado(null);
    setFacturando(true);

    try {
      const res = await fetch('/api/facturas/nueva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          monto: parseFloat(monto),
          tipo: tipoFactura,
          cliente: {
            docTipo: parseInt(clienteDocTipo),
            docNro: clienteDocNro,
            razonSocial: clienteNombre,
            pais: clientePais,
            moneda: moneda,
          }
        }),
      });

      const data = await res.json();

      console.log('Response:', res.status, data);

      if (!res.ok) {
        setError(data.error || `Error al generar factura (${res.status})`);
        return;
      }

      setResultado(data.factura);
      setMonto('');
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión: ' + err.message);
    } finally {
      setFacturando(false);
    }
  };

  if (loading) return <div className="text-center py-8">Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard" className="text-blue-800 hover:underline">
          ← Volver
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">📝 Nueva Factura</h1>

      {/* Resultado exitoso */}
      {resultado && (
        <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-4">✅ Factura Generada</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Número:</span> {resultado.numero}
            </div>
            <div>
              <span className="font-medium">Tipo:</span> Factura {resultado.tipo.replace('Factura ', '')}
            </div>
            <div>
              <span className="font-medium">CAE:</span> {resultado.cae}
            </div>
            <div>
              <span className="font-medium">Vencimiento:</span> {new Date(resultado.caeVencimiento).toLocaleDateString('es-AR')}
            </div>
            <div className="col-span-2">
              <span className="font-medium">Monto:</span> ${resultado.monto.toFixed(2)}
            </div>
          </div>
          <button
            onClick={() => setResultado(null)}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Nueva Factura
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Formulario */}
      {!resultado && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Selector de cliente guardado */}
            {clientes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿O seleccionar un cliente guardado?
                </label>
                <select
                  value={clienteSeleccionado || ''}
                  onChange={(e) => {
                    setClienteSeleccionado(e.target.value ? parseInt(e.target.value) : null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">-- Seleccionar cliente --</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.tipoFactura})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  <Link href="/dashboard/clientes" className="text-blue-800 hover:underline">
                    + Agregar nuevo cliente
                  </Link>
                </p>
              </div>
            )}

            {/* Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Qué vas a facturar?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPreset(p.id)}
                    className={`p-3 border-2 rounded-lg text-center transition ${
                      preset === p.id 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{p.icon}</div>
                    <div className="text-xs font-medium">{p.label}</div>
                    <div className="text-xs text-gray-500">{p.descripcion}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Datos del Cliente según preset */}
            {presetActual.necesitaCliente && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                
                {/* Factura E: País y Moneda */}
                {tipoFactura === 'E' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        País del cliente
                      </label>
                      <select
                        value={clientePais}
                        onChange={(e) => setClientePais(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="US">Estados Unidos</option>
                        <option value="UK">Reino Unido</option>
                        <option value="DE">Alemania</option>
                        <option value="ES">España</option>
                        <option value="BR">Brasil</option>
                        <option value="MX">México</option>
                        <option value="CO">Colombia</option>
                        <option value="CL">Chile</option>
                        <option value="AR">Argentina</option>
                        <option value="OT">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Moneda
                      </label>
                      <select
                        value={moneda}
                        onChange={(e) => setMoneda(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="USD">USD - Dólares</option>
                        <option value="EUR">EUR - Euros</option>
                        <option value="ARS">ARS - Pesos</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Factura A/B: CUIT/DNI */}
                {(tipoFactura === 'A' || tipoFactura === 'B') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo Documento
                      </label>
                      <select
                        value={clienteDocTipo}
                        onChange={(e) => setClienteDocTipo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="80">CUIT</option>
                        <option value="96">DNI</option>
                        <option value="86">CUIL</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número Documento
                      </label>
                      <input
                        type="text"
                        value={clienteDocNro}
                        onChange={(e) => setClienteDocNro(e.target.value.replace(/\D/g, ''))}
                        placeholder={clienteDocTipo === '80' ? '20123456789' : '12345678'}
                        maxLength={11}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </>
                )}

                <div className={tipoFactura === 'E' ? 'md:col-span-2' : 'md:col-span-2'}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Razón Social / Nombre
                  </label>
                  <input
                    type="text"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    placeholder={tipoFactura === 'E' ? 'Twitch Interactive Inc.' : 'Empresa S.A.'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            )}

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto ({moneda})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="100.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-lg"
                required
              />
            </div>

            {/* Info según tipo */}
            <div className="p-4 bg-blue-50 rounded text-sm text-blue-700">
              <p className="font-medium mb-1">📋 Resumen:</p>
              <ul className="space-y-1">
                <li>• Tipo: Factura {tipoFactura} ({
                  tipoFactura === 'E' ? 'Exportación' :
                  tipoFactura === 'A' ? 'discrimina IVA' :
                  tipoFactura === 'B' ? 'IVA incluido' : 'sin IVA'
                })</li>
                <li>• Concepto: Servicios de Streaming</li>
                {tipoFactura === 'E' && <li>• Moneda: {moneda}</li>}
                {tipoFactura === 'E' && <li>• País: {clientePais}</li>}
                <li>• IVA: {tipoFactura === 'C' || tipoFactura === 'E' ? 'No aplica (0%)' : '21%'}</li>}
              </ul>
            </div>

            <button
              type="submit"
              disabled={facturando}
              className="w-full py-3 px-4 bg-blue-800 text-white rounded-lg hover:bg-blue-900 disabled:opacity-50 text-lg font-medium"
            >
              {facturando ? 'Generando Factura...' : `Generar Factura ${tipoFactura}`}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}