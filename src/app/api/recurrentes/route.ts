import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/sessions';
import { db, sql } from '@/lib/db';
import { recurrentes } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

// GET - listar recurrentes
export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const userRecurrentes = await db.select()
    .from(recurrentes)
    .where(eq(recurrentes.usuarioId, userId))
    .orderBy(recurrentes.id);

  return NextResponse.json({ recurrentes: userRecurrentes.reverse() });
}

// POST - crear recurrente
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    
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

    // Guardar en DB usando SQL raw
    const result = await sql`INSERT INTO recurrentes (
        usuario_id, cliente_id, cliente_nombre, monto, tipo_factura,
        frecuencia, fecha_inicio, proxima_fecha, activa
      ) VALUES (${userId}, ${clienteId || null}, ${clienteNombre || 'Cliente'}, ${monto}, ${tipoFactura || 'C'}, ${frecuencia}, ${fecha.toISOString()}, ${proximaFecha.toISOString()}, ${true})
      RETURNING id`;

    const nuevo = {
      id: result[0].id,
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
    const userId = await getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, activa } = body;

    await db.update(recurrentes)
      .set({ activa })
      .where(and(
        eq(recurrentes.id, id),
        eq(recurrentes.usuarioId, userId)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update recurrente error:', error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

// DELETE - eliminar
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

    await db.delete(recurrentes)
      .where(and(
        eq(recurrentes.id, id),
        eq(recurrentes.usuarioId, userId)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete recurrente error:', error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
