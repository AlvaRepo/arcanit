import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/sessions';
import { db } from '@/lib/db';
import { clientes } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

// GET - listar clientes
export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const userClientes = await db.select()
    .from(clientes)
    .where(eq(clientes.usuarioId, userId));

  return NextResponse.json({ clientes: userClientes.reverse() });
}

// POST - crear cliente
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, tipo, tipoDocumento, numeroDocumento, razonSocial, pais, moneda, tipoFactura } = body;

    if (!nombre || !tipo) {
      return NextResponse.json({ error: 'Nombre y tipo son requeridos' }, { status: 400 });
    }

    const result = await db.insert(clientes)
      .values({
        usuarioId: userId,
        nombre,
        tipo,
        tipoDocumento: tipoDocumento || 80,
        numeroDocumento: numeroDocumento || '',
        razonSocial: razonSocial || '',
        pais: pais || 'AR',
        moneda: moneda || 'ARS',
        tipoFactura: tipoFactura || 'C',
      })
      .returning({ id: clientes.id });

    const newCliente = {
      id: result[0].id,
      usuarioId: userId,
      nombre,
      tipo,
      tipoDocumento: tipoDocumento || 80,
      numeroDocumento: numeroDocumento || '',
      razonSocial: razonSocial || '',
      pais: pais || 'AR',
      moneda: moneda || 'ARS',
      tipoFactura: tipoFactura || 'C',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, cliente: newCliente });
  } catch (error) {
    console.error('Create client error:', error);
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 });
  }
}

// DELETE - eliminar cliente
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    if (!idParam) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }
    const id = parseInt(idParam);

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await db.delete(clientes)
      .where(and(
        eq(clientes.id, id),
        eq(clientes.usuarioId, userId)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete client error:', error);
    return NextResponse.json({ error: 'Error al eliminar cliente' }, { status: 500 });
  }
}
