import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, nombre } = await request.json();

    if (!email || !password || !nombre) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const [existingUser] = await db.select().from(users).where(eq(users.email, email));

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 409 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        nombre,
      })
      .returning();

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        nombre: newUser.nombre,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}