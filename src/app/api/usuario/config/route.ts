import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// Obtener usuario actual
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const [user]: any = await sql`
      SELECT id, email, nombre, cuit, punto_venta, config_completa, 
             CASE WHEN certificado IS NOT NULL THEN true ELSE false END as tiene_certificado
      FROM users 
      WHERE id = ${parseInt(userId)}
    `;

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

    // Manejo de certificados - guardar en DB como base64
    let certificadoBase64 = null;
    let clavePrivadaBase64 = null;
    
    const certificado = formData.get('certificado') as File | null;
    const clavePrivada = formData.get('clavePrivada') as File | null;
    
    // Validar formato básico del certificado (debe ser legible)
    if (certificado) {
      const certBuffer = Buffer.from(await certificado.arrayBuffer());
      // Verificar que no esté vacío
      if (certBuffer.length === 0) {
        return NextResponse.json({ error: 'El certificado está vacío' }, { status: 400 });
      }
      // Convertir a base64 para guardar en DB
      certificadoBase64 = certBuffer.toString('base64');
    }

    if (clavePrivada) {
      const keyBuffer = Buffer.from(await clavePrivada.arrayBuffer());
      if (keyBuffer.length === 0) {
        return NextResponse.json({ error: 'La clave privada está vacía' }, { status: 400 });
      }
      clavePrivadaBase64 = keyBuffer.toString('base64');
    }

    // Verificar si tiene certificados existentes en DB
    const [userBefore]: any = await sql`
      SELECT certificado, clave_privada FROM users WHERE id = ${parseInt(userId)}
    `;

    // Usar certificados nuevos o los existentes
    const tieneCertificado = certificadoBase64 || userBefore?.certificado;

    // Actualizar usuario usando SQL raw para evitar conflictos de tipos
    await sql`
      UPDATE users SET
        cuit = ${cuit},
        punto_venta = ${parseInt(puntoVenta)},
        certificado = COALESCE(${certificadoBase64}, certificado),
        clave_privada = COALESCE(${clavePrivadaBase64}, clave_privada),
        config_completa = ${tieneCertificado ? true : false},
        updated_at = NOW()
      WHERE id = ${parseInt(userId)}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Config update error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}