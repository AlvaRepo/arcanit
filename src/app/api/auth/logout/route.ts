import { NextResponse } from 'next/server';
import { destroySession, getUserIdFromRequest } from '@/lib/sessions';

export async function POST(request: Request) {
  try {
    // Obtener el token de la cookie y destruir la sesión
    const userId = getUserIdFromRequest(request);
    
    if (userId) {
      // Buscar y destruir la sesión del usuario
      // Nota: en un sistema real, el token está en la cookie
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split('; ').find(c => c.startsWith('session='));
        if (cookies) {
          const token = cookies.split('=')[1];
          if (token) {
            destroySession(token);
          }
        }
      }
    }

    const response = NextResponse.json({ success: true });
    
    // Eliminar cookie
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: true }); // Always return success
  }
}