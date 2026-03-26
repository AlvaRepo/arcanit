import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/sessions';
import { db } from '@/lib/db';
import { recurrentes } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

// GET - listar recurrentes
export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const userRecurrentes = db.select()
    .from(recurrentes)
    .where(eq(recurrentes.usuarioId, userId))
    .orderBy(recurrentes.id)
    .all() as any[];

  return NextResponse.json({ recurrentes: userRecurrentes.reverse() });
}

// POST - crear recurrente
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { clienteId, clienteNombre, monto, tipoFactura, frecuencia, fechaInicio } = body;

    if (!monto || !frecuencia) {
      return NextResponse.json({ error: 'Monto y frecuencia son requeridos' }, { status: 400 });
    }

    // Calcular próxima fecha según frecuencia
    const fecha = new Date(fechaInicio || new Date());
    let proximaFecha: Date;
    
    switch (frecuencia) {
      case 'semanal':
        proximaFecha = new Date(fecha);
        proximaFecha.setDate(proximaFecha.getDate() + 7);
        break;
      case 'quincenal':
        proximaFecha = new Date(fecha);
        proximaFecha.setDate(proximaFecha.getDate() + 15);
        break;
      case 'mensual':
        proximaFecha = new Date(fecha);
        proximaFecha.setMonth(proximaFecha.getMonth() + 1);
        break;
      default:
        proximaFecha = new Date(fecha);
        proximaFecha.setMonth(proximaFecha.getMonth() + 1);
    }

    const result = db.insert(recurrentes)
      .values({
        usuarioId: userId,
        clienteId: clienteId || null,
        clienteNombre: clienteNombre || 'Cliente',
        monto: String(monto),
        tipoFactura: tipoFactura || 'C',
        frecuencia,
        fechaInicio: fecha.toISOString(),
        proximaFecha: proximaFecha.toISOString(),
        activa: true,
      })
      .run();

    const nuevo = {
      id: result.lastInsertRowid,
      usuarioId: userId,
      clienteId: clienteId || null,
      clienteNombre: clienteNombre || 'Cliente',
      monto,
      tipoFactura: tipoFactura || 'C',
      frecuencia,
      fechaInicio: fecha.toISOString(),
      proximaFecha: proximaFecha.toISOString(),
      activa: true,
    };

    return NextResponse.json({ success: true, recurrente: nuevo });
  } catch (error) {
    console.error('Create recurrente error:', error);
    return NextResponse.json({ error: 'Error al crear facturación recurrente' }, { status: 500 });
  }
}

// PUT - activar/desactivar
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, activa } = body;

    db.update(recurrentes)
      .set({ activa })
      .where(and(
        eq(recurrentes.id, id),
        eq(recurrentes.usuarioId, userId)
      ))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update recurrente error:', error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

// DELETE - eliminar
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'));

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    db.delete(recurrentes)
      .where(and(
        eq(recurrentes.id, id),
        eq(recurrentes.usuarioId, userId)
      ))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete recurrente error:', error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
