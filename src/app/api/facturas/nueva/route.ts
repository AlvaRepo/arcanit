import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/sessions';
import { db, sql } from '@/lib/db';
import { facturas, users } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

// Mapear tipo de factura a código ARCA
const TIPO_FACTURA_CODIGO: Record<string, number> = {
  'A': 1,
  'B': 6,
  'C': 11,
  'E': 19, // Factura E (exportación)
  'M': 51,
};

// Calcular IVA según tipo de factura
function calcularIVA(monto: number, tipo: string): { neto: number; iva: number } {
  if (tipo === 'C' || tipo === 'E' || tipo === 'M') {
    return { neto: monto, iva: 0 };
  } else if (tipo === 'B') {
    const neto = monto / 1.21;
    return { neto: Math.round(neto * 100) / 100, iva: Math.round((monto - neto) * 100) / 100 };
  } else {
    const neto = monto / 1.21;
    return { neto: Math.round(neto * 100) / 100, iva: Math.round((monto - neto) * 100) / 100 };
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { monto, tipo = 'C', cliente } = body;

    if (!monto || monto <= 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
    }

    const tipoLetra = tipo.toUpperCase();
    if (!TIPO_FACTURA_CODIGO[tipoLetra]) {
      return NextResponse.json({ error: 'Tipo de factura inválido' }, { status: 400 });
    }

    // Validaciones específicas por tipo
    if (tipoLetra === 'A') {
      if (!cliente?.docNro || cliente.docNro.length !== 11) {
        return NextResponse.json({ error: 'Para Factura A debe ingresar CUIT del cliente (11 dígitos)' }, { status: 400 });
      }
    }

    if (tipoLetra === 'E' && !cliente?.pais) {
      return NextResponse.json({ error: 'Para Factura E debe seleccionar el país del cliente' }, { status: 400 });
    }

    // Calcular montos (IVA)
    const { neto, iva } = calcularIVA(monto, tipoLetra);

    // Obtener último número de factura del usuario
    const lastInvoice = await db.select()
      .from(facturas)
      .where(eq(facturas.usuarioId, userId))
      .orderBy(facturas.numero);
    
    const numeroFactura = lastInvoice.length > 0 ? (lastInvoice[lastInvoice.length - 1].numero || 0) + 1 : 1;

    // Generar CAE simulado
    const cae = Math.random().toString().slice(2, 16).padStart(14, '0');
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);

    // Guardar en DB - usando SQL raw para evitar conflictos de tipos
    await sql`INSERT INTO facturas (
        usuario_id, cliente_id, numero, tipo, tipo_letra, concepto,
        monto, monto_neto, monto_iva, cliente_doc_tipo, cliente_doc_nro,
        cliente_razon_social, cliente_pais, cliente_moneda, cae, cae_vencimiento, resultado
      ) VALUES (${userId}, ${cliente?.id || null}, ${numeroFactura}, ${`Factura ${tipoLetra}`}, ${tipoLetra}, ${'Servicios de Streaming'}, ${monto}, ${neto}, ${iva}, ${cliente?.docTipo ? parseInt(cliente.docTipo) : 99}, ${cliente?.docNro || ''}, ${cliente?.razonSocial || (tipoLetra === 'E' ? 'Cliente Exterior' : 'Consumidor Final')}, ${cliente?.pais || ''}, ${cliente?.moneda || 'ARS'}, ${cae}, ${fechaVencimiento.toISOString()}, ${'A'})`;

    return NextResponse.json({
      success: true,
      factura: {
        numero: numeroFactura,
        tipo: `Factura ${tipoLetra}`,
        cae: cae,
        caeVencimiento: fechaVencimiento.toISOString(),
        resultado: 'A',
        monto: monto,
        montoNeto: neto,
        montoIVA: iva,
      },
    });

  } catch (error) {
    console.error('Invoice creation error:', error);
    return NextResponse.json(
      { error: 'Error al generar la factura' },
      { status: 500 }
    );
  }
}

// GET - listar facturas del usuario
export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const userFacturas = await db.select()
    .from(facturas)
    .where(eq(facturas.usuarioId, userId))
    .orderBy(facturas.numero);

  return NextResponse.json({ facturas: userFacturas.reverse() });
}
