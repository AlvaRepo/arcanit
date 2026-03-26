import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/sessions';

// ============================================================
// USUARIO ADMIN HARCODEADO (TEMPORAL - HASTA MONGODB)
// ============================================================
const ADMIN_USER = {
  id: 1,
  email: 'admin@arcanit.com',
  nombre: 'Administrador',
  configCompleta: true,
  cuit: '20123456789',
  puntoVenta: 1,
};

export async function GET(request: NextRequest) {
  try {
    // Verificar sesión desde cookie
    const userId = await getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que sea el admin
    if (userId === ADMIN_USER.id) {
      return NextResponse.json({ 
        user: {
          id: ADMIN_USER.id,
          email: ADMIN_USER.email,
          nombre: ADMIN_USER.nombre,
          configCompleta: ADMIN_USER.configCompleta,
          cuit: ADMIN_USER.cuit,
          puntoVenta: ADMIN_USER.puntoVenta,
        }
      });
    }

    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}