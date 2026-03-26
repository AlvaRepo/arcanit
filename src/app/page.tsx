import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default function Home() {
  const sessionCookie = cookies().get('session');
  
  // If not logged in, show landing page
  if (!sessionCookie) {
    return (
      <div className="text-center py-16">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-blue-800 mb-2">FactuARCA</h1>
          <p className="text-xl text-gray-600">Facturación Electrónica Argentina</p>
        </div>
        
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          La forma más fácil de emitir facturas electrónicas a través de ARCA.
          Facturá rápido, sin complicaciones y con respaldo legal.
        </p>
        <div className="flex justify-center gap-4">
          <Link 
            href="/login"
            className="px-6 py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition"
          >
            Iniciar Sesión
          </Link>
          <Link 
            href="/register"
            className="px-6 py-3 border-2 border-blue-800 text-blue-800 rounded-lg hover:bg-blue-800 hover:text-white transition"
          >
            Registrarse
          </Link>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="font-bold text-lg mb-2">Costo Cero</h3>
            <p className="text-gray-600">Conexión directa a ARCA sin intermediarios</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-bold text-lg mb-2">Factura A, B y C</h3>
            <p className="text-gray-600">Todos los tipos de comprobantes</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="font-bold text-lg mb-2">Seguro</h3>
            <p className="text-gray-600">Tus datos protegidos y facturación legal</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="text-3xl mb-2">📱</div>
            <h3 className="font-bold text-lg mb-2">Online</h3>
            <p className="text-gray-600">Accedé desde cualquier lugar</p>
          </div>
        </div>
      </div>
    );
  }

  // If logged in, redirect to dashboard
  redirect('/dashboard');
}