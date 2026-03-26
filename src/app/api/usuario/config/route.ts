import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Obtener usuario actual
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value;
    
    // Por ahora, usamos un endpoint simple para obtener datos del usuario
    // En producción, esto validaría la sesión contra la DB
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const [user] = await db.select({
      id: users.id,
      email: users.email,
      nombre: users.nombre,
      cuit: users.cuit,
      puntoVenta: users.puntoVenta,
      configCompleta: users.configCompleta,
    }).from(users).where(eq(users.id, parseInt(userId)));

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// Actualizar configuración
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const cuit = formData.get('cuit')?.toString();
    const puntoVenta = formData.get('puntoVenta')?.toString();

    if (!cuit || !puntoVenta) {
      return NextResponse.json({ error: 'CUIT y punto de venta requeridos' }, { status: 400 });
    }

    // Verificar longitud de CUIT
    if (cuit.length !== 11) {
      return NextResponse.json({ error: 'CUIT debe tener 11 dígitos' }, { status: 400 });
    }

    // Manejo de certificados
    let certificadoPath = '';
    let clavePrivadaPath = '';
    
    const certificado = formData.get('certificado') as File | null;
    const clavePrivada = formData.get('clavePrivada') as File | null;

    // Carpeta para certificados del usuario
    const certDir = join(process.cwd(), 'certificados', userId);
    
    if (certificado) {
      await mkdir(certDir, { recursive: true });
      const certBuffer = Buffer.from(await certificado.arrayBuffer());
      certificadoPath = join(certDir, `cert_${Date.now()}.crt`);
      await writeFile(certificadoPath, certBuffer);
    }

    if (clavePrivada) {
      await mkdir(certDir, { recursive: true });
      const keyBuffer = Buffer.from(await clavePrivada.arrayBuffer());
      clavePrivadaPath = join(certDir, `key_${Date.now()}.key`);
      await writeFile(clavePrivadaPath, keyBuffer);
    }

    // Actualizar usuario
    const updateData: any = {
      cuit,
      puntoVenta: parseInt(puntoVenta),
      updatedAt: new Date(),
    };

    // Solo actualizar paths si se proporcionaron nuevos certificados
    if (certificadoPath) updateData.certificadoPath = certificadoPath;
    if (clavePrivadaPath) updateData.clavePrivadaPath = clavePrivadaPath;

    // Verificar si tiene todo para marcar config como completa
    const [userBefore] = await db.select().from(users).where(eq(users.id, parseInt(userId)));
    const tieneCertificado = certificadoPath || userBefore?.certificado;
    
    if (cuit && puntoVenta && tieneCertificado) {
      updateData.configCompleta = true;
    }

    await db.update(users).set(updateData).where(eq(users.id, parseInt(userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Config update error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}