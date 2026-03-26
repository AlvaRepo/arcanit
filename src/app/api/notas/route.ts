import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/sessions';
import { db, sql } from '@/lib/db';
import { notas } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// Mapear tipo de nota a código ARCA
const TIPO_NOTA_CODIGO: Record<string, { credito: number; debito: number }> = {
  'A': { credito: 201, debito: 202 },
  'B': { credito: 206, debito: 206 },
  'C': { credito: 211, debito: 212 },
  'E': { credito: 213, debito: 214 },
};

// GET - listar notas
export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const userNotas = await db.select()
    .from(notas)
    .where(eq(notas.usuarioId, userId))
    .orderBy(notas.numero);

  return NextResponse.json({ notas: userNotas.reverse() });
}

// POST - crear nota
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { tipo, tipoFactura, monto, motivo } = body;

    if (!tipo || !monto || !motivo) {
      return NextResponse.json({ error: 'Tipo, monto y motivo son requeridos' }, { status: 400 });
    }

    const tipoLetra = tipoFactura || 'C';
    const codigos = TIPO_NOTA_CODIGO[tipoLetra];
    
    if (!codigos) {
      return NextResponse.json({ error: 'Tipo de factura inválido' }, { status: 400 });
    }

    // Calcular IVA
    let montoNeto = monto;
    let montoIVA = 0;
    if (tipoFactura === 'A' || tipoFactura === 'B') {
      montoNeto = Math.round((monto / 1.21) * 100) / 100;
      montoIVA = Math.round((monto - montoNeto) * 100) / 100;
    }

    // Obtener último número de nota
    const lastNotas = await db.select()
      .from(notas)
      .where(eq(notas.usuarioId, userId))
      .orderBy(notas.numero);
    
    const numeroNota = lastNotas.length > 0 ? (lastNotas[lastNotas.length - 1].numero || 0) + 1 : 1;

    const tipoComprobante = tipo === 'credito' ? codigos.credito : codigos.debito;
    const cae = Math.random().toString().slice(2, 16).padStart(14, '0');
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);

    // Guardar en DB usando SQL raw
    await sql`INSERT INTO notas (
        usuario_id, numero, tipo, tipo_letra, motivo,
        monto, monto_neto, monto_iva, cae, cae_vencimiento, resultado
      ) VALUES (${userId}, ${numeroNota}, ${tipo}, ${tipoLetra}, ${motivo}, ${monto}, ${montoNeto}, ${montoIVA}, ${cae}, ${fechaVencimiento.toISOString()}, ${'A'})`;

    return NextResponse.json({
      success: true,
      nota: {
        numero: numeroNota,
        tipo: tipo === 'credito' ? 'Nota de Crédito' : 'Nota de Débito',
        tipoLetra,
        cae,
        caeVencimiento: fechaVencimiento.toISOString(),
        resultado: 'A',
        monto,
      },
    });
  } catch (error) {
    console.error('Create nota error:', error);
    return NextResponse.json({ error: 'Error al crear nota' }, { status: 500 });
  }
}
