import { NextRequest, NextResponse } from 'next/server';
import { createSession, destroyUserSessions, getUserByEmail } from '@/lib/sessions';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña requeridos' },
        { status: 400 }
      );
    }

    // Buscar usuario en la base de datos
    const user = await getUserByEmail(email);

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // Destruir sesiones anteriores del usuario (anti-sharing)
    await destroyUserSessions(user.id);
    
    // Crear nueva sesión
    const { token, expiresAt } = await createSession(user.id);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        configCompleta: !!user.configCompleta,
        cuit: user.cuit,
        puntoVenta: user.puntoVenta,
      },
    });

    // Guardar cookie de sesión
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
