// Servicio para conectar con AFIP/ARCA usando @afipsdk/afip.js
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Afip, ElectronicBilling } = require('@afipsdk/afip.js');
import { sql } from './db';
import {
  AFIPInvoiceRequest,
  AFIPInvoiceResponse,
  AFIPConfig,
  AFIP_CBTE_TIPOS,
  AFIP_DOC_TIPOS,
} from '@/types/afip';

export class AFIPService {
  private afip: any = null;
  private config: AFIPConfig | null = null;

  /**
   * Inicializar el servicio AFIP con la configuración del usuario
   */
  async initialize(userId: number): Promise<void> {
    // Obtener certificado y datos del usuario desde la DB
    const [user]: any = await sql`
      SELECT certificado, clave_privada, cuit, punto_venta 
      FROM users 
      WHERE id = ${userId}
    `;

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (!user.certificado || !user.clave_privada) {
      throw new Error('Certificado no configurado. Por favor, configure su certificado en la sección de configuración.');
    }

    if (!user.cuit) {
      throw new Error('CUIT no configurado. Por favor, configure su CUIT en la sección de configuración.');
    }

    if (!user.punto_venta) {
      throw new Error('Punto de venta no configurado. Por favor, configure su punto de venta en la sección de configuración.');
    }

    // Decodificar certificado y clave de base64
    const certificado = Buffer.from(user.certificado, 'base64').toString('utf8');
    const clavePrivada = Buffer.from(user.clave_privada, 'base64').toString('utf8');

    this.config = {
      certificado,
      clavePrivada,
      cuit: user.cuit,
      puntoVenta: user.punto_venta,
      ambiente: process.env.NODE_ENV === 'production' ? 'produccion' : 'testing',
    };

    this.afip = new Afip({
      CUIT: this.config.cuit,
      cert: this.config.certificado,
      key: this.config.clavePrivada,
      production: this.config.ambiente === 'produccion',
    });
  }

  /**
   * Obtener el último número de comprobante
   */
  async getLastVoucherNumber(tipoCbte: number): Promise<number> {
    if (!this.afip || !this.config) {
      throw new Error('AFIP no inicializado. Llame a initialize() primero.');
    }

    const eb = new ElectronicBilling(this.afip);
    const lastNumber = await eb.getLastVoucher(this.config.puntoVenta, tipoCbte);
    return lastNumber;
  }

  /**
   * Crear una factura electrónica y obtener CAE de AFIP
   */
  async createInvoice(request: AFIPInvoiceRequest): Promise<AFIPInvoiceResponse> {
    if (!this.afip || !this.config) {
      throw new Error('AFIP no inicializado. Llame a initialize() primero.');
    }

    try {
      const eb = new ElectronicBilling(this.afip);

      // Obtener último número de comprobante
      const lastNumber = await eb.getLastVoucher(this.config.puntoVenta, request.tipoCbte);
      const nuevoNumero = lastNumber + 1;

      // Preparar datos para AFIP
      const voucherData: any = {
        CbteDesde: nuevoNumero,
        CbteHasta: nuevoNumero,
        PtoVta: this.config.puntoVenta,
        CbteTipo: request.tipoCbte,
        DocTipo: request.tipoDoc,
        DocNro: request.nroDoc,
        ImpTotal: request.impTotal,
        ImpNeto: request.impNeto,
        ImpIVA: request.impIVA,
        ImpTrib: request.impTrib || 0,
        FechaCbte: request.fechaCbte,
        Concepto: request.concepto,
      };

      // Agregar datos opcionales del cliente
      if (request.clienteRazonSocial) {
        voucherData.Cliente = request.clienteRazonSocial;
      }
      if (request.clienteDocTipo) {
        voucherData.DocTipo = request.clienteDocTipo;
      }
      if (request.clienteDocNro) {
        voucherData.DocNro = request.clienteDocNro;
      }

      // Llamar a AFIP
      const result = await eb.createVoucher(voucherData);

      return {
        cae: result.CAE,
        fechaVencimiento: result.CAEFchVto,
        resultado: 'A',
      };
    } catch (error: any) {
      console.error('Error al crear factura en AFIP:', error);

      const errores = error?.response?.data?.errors || error?.errors || [];
      const msg = error?.message || 'Error desconocido al crear factura';

      return {
        cae: '',
        fechaVencimiento: '',
        resultado: 'R',
        errores: errores.length > 0
          ? errores.map((e: any) => ({ code: e.Code || 0, msg: e.Msg || msg }))
          : [{ code: -1, msg }],
      };
    }
  }

  /**
   * Probar conexión con AFIP
   */
  async testConnection(): Promise<boolean> {
    if (!this.afip) {
      return false;
    }

    try {
      const eb = new ElectronicBilling(this.afip);
      await eb.getLastVoucher(this.config!.puntoVenta, 11);
      return true;
    } catch (error) {
      console.error('Error probando conexión AFIP:', error);
      return false;
    }
  }
}

// Instancia singleton del servicio
let afipServiceInstance: AFIPService | null = null;

export function getAFIPService(): AFIPService {
  if (!afipServiceInstance) {
    afipServiceInstance = new AFIPService();
  }
  return afipServiceInstance;
}

/**
 * Helper para mapear tipo de factura a código AFIP
 */
export function getTipoCbte(tipoLetra: string): number {
  const map: Record<string, number> = {
    'A': AFIP_CBTE_TIPOS.FACTURA_A,
    'B': AFIP_CBTE_TIPOS.FACTURA_B,
    'C': AFIP_CBTE_TIPOS.FACTURA_C,
    'E': AFIP_CBTE_TIPOS.FACTURA_E,
    'M': AFIP_CBTE_TIPOS.FACTURA_M,
  };
  return map[tipoLetra.toUpperCase()] || AFIP_CBTE_TIPOS.FACTURA_C;
}

/**
 * Helper para mapear tipo de documento
 */
export function getTipoDoc(tipo: number | string): number {
  const map: Record<string, number> = {
    '80': AFIP_DOC_TIPOS.CUIT,
    'CUIT': AFIP_DOC_TIPOS.CUIT,
    '96': AFIP_DOC_TIPOS.DNI,
    'DNI': AFIP_DOC_TIPOS.DNI,
    '86': AFIP_DOC_TIPOS.CUIL,
    'CUIL': AFIP_DOC_TIPOS.CUIL,
  };
  return map[String(tipo)] || AFIP_DOC_TIPOS.DNI;
}
