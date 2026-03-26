import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/sessions';
import { db, sql } from '@/lib/db';
import { facturas, users } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { AFIPService, getTipoCbte, getTipoDoc } from '@/lib/afip';

// Mapear tipo de factura a código ARCA
const TIPO_FACTURA_CODIGO: Record<string, number> = {
  'A': 1,
  'B': 6,
  'C': 11,
  'E': 19, // Factura E (exportación)
  'M': 51,
};

// Feature flag para usar AFIP real o simulado
const USE_AFIP_REAL = process.env.USE_AFIP_REAL === 'true';

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

    let cae = '';
    let fechaVencimiento = new Date();
    let resultado = 'A';

    // Si USE_AFIP_REAL está habilitado, intentar usar AFIP real
    if (USE_AFIP_REAL) {
      try {
        // Verificar si el usuario tiene certificado configurado
        const [userData]: any = await sql`
          SELECT certificado, clave_privada, punto_venta 
          FROM users 
          WHERE id = ${userId}
        `;

        if (!userData?.certificado || !userData?.clave_privada) {
          return NextResponse.json({ 
            error: 'Certificado no configurado. Por favor, configure su certificado en la sección de configuración.' 
          }, { status: 400 });
        }

        // Usar servicio AFIP
        const afipService = new AFIPService();
        await afipService.initialize(userId);

        // Preparar datos para AFIP
        const afipRequest = {
          tipoDoc: cliente?.docTipo ? getTipoDoc(cliente.docTipo) : 99,
          nroDoc: cliente?.docNro || '',
          tipoCbte: getTipoCbte(tipoLetra),
          puntoVenta: userData.punto_venta,
          cbtDesde: numeroFactura,
          cbtHasta: numeroFactura,
          impTotal: monto,
          impNeto: neto,
          impIVA: iva,
          fechaCbte: new Date().toISOString().split('T')[0].replace(/-/g, ''),
          concepto: 3, // Mixtos (productos y servicios)
          clienteRazonSocial: cliente?.razonSocial || (tipoLetra === 'E' ? 'Cliente Exterior' : 'Consumidor Final'),
          clienteDocTipo: cliente?.docTipo ? getTipoDoc(cliente.docTipo) : undefined,
          clienteDocNro: cliente?.docNro || undefined,
        };

        const afipResult = await afipService.createInvoice(afipRequest);

        if (afipResult.resultado === 'A' && afipResult.cae) {
          cae = afipResult.cae;
          fechaVencimiento = new Date(afipResult.fechaVencimiento);
          resultado = 'A';
        } else {
          // AFIP devolvió error
          const erroresMsg = afipResult.errores?.map(e => e.msg).join(', ') || 'Error desconocido';
          return NextResponse.json({ 
            error: `Error de AFIP: ${erroresMsg}` 
          }, { status: 400 });
        }
      } catch (afipError: any) {
        console.error('Error en AFIP:', afipError);
        return NextResponse.json({ 
          error: afipError.message || 'Error al conectar con AFIP' 
        }, { status: 500 });
      }
    } else {
      // Modo desarrollo: CAE simulado
      cae = Math.random().toString().slice(2, 16).padStart(14, '0');
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
    }

    // Guardar en DB - usando SQL raw para evitar conflictos de tipos
    await sql`INSERT INTO facturas (
        usuario_id, cliente_id, numero, tipo, tipo_letra, concepto,
        monto, monto_neto, monto_iva, cliente_doc_tipo, cliente_doc_nro,
        cliente_razon_social, cliente_pais, cliente_moneda, cae, cae_vencimiento, resultado
      ) VALUES (${userId}, ${cliente?.id || null}, ${numeroFactura}, ${`Factura ${tipoLetra}`}, ${tipoLetra}, ${'Servicios de Streaming'}, ${monto}, ${neto}, ${iva}, ${cliente?.docTipo ? parseInt(cliente.docTipo) : 99}, ${cliente?.docNro || ''}, ${cliente?.razonSocial || (tipoLetra === 'E' ? 'Cliente Exterior' : 'Consumidor Final')}, ${cliente?.pais || ''}, ${cliente?.moneda || 'ARS'}, ${cae}, ${fechaVencimiento.toISOString()}, ${resultado})`;

    return NextResponse.json({
      success: true,
      factura: {
        numero: numeroFactura,
        tipo: `Factura ${tipoLetra}`,
        cae: cae,
        caeVencimiento: fechaVencimiento.toISOString(),
        resultado: resultado,
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
