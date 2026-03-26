// Tipos para la integración con AFIP/ARCA

// Tipos de documento según AFIP
export const AFIP_DOC_TIPOS = {
  CUIT: 80,
  DNI: 96,
  CUIL: 86,
  LE: 87,
  LC: 88,
} as const;

// Tipos de comprobante según AFIP
export const AFIP_CBTE_TIPOS = {
  FACTURA_A: 1,
  NOTA_DEBITO_A: 2,
  NOTA_CREDITO_A: 3,
  RECIBO_A: 4,
  FACTURA_B: 6,
  NOTA_DEBITO_B: 7,
  NOTA_CREDITO_B: 8,
  RECIBO_B: 9,
  FACTURA_C: 11,
  NOTA_DEBITO_C: 12,
  NOTA_CREDITO_C: 13,
  RECIBO_C: 15,
  FACTURA_E: 19,
  NOTA_DEBITO_E: 20,
  NOTA_CREDITO_E: 21,
  FACTURA_M: 51,
  NOTA_DEBITO_M: 52,
  NOTA_CREDITO_M: 53,
} as const;

// Conceptos
export const AFIP_CONCEPTOS = {
  PRODUCTOS: 1,
  SERVICIOS: 2,
  MIXTO: 3,
} as const;

// Interfaces para request/response AFIP
export interface AFIPInvoiceRequest {
  tipoDoc: number;
  nroDoc: string;
  tipoCbte: number;
  puntoVenta: number;
  cbtDesde: number;
  cbtHasta: number;
  impTotal: number;
  impNeto: number;
  impIVA: number;
  impTrib?: number;
  fechaCbte: string; // YYYYMMDD
  concepto: number;
  // Datos del cliente
  clienteRazonSocial?: string;
  clienteDocTipo?: number;
  clienteDocNro?: string;
  clienteDireccion?: string;
  clientePais?: string;
  clienteMoneda?: string;
  clienteObs?: string;
}

export interface AFIPInvoiceResponse {
  caea?: string;
  cae: string;
  fechaVencimiento: string;
  resultado: 'A' | 'R' | 'O';
  errores?: Array<{ code: number; msg: string }>;
 observaciones?: Array<{ code: number; msg: string }>;
}

export interface AFIPError {
  code: number;
  msg: string;
}

// Tipos para el servicio
export interface AFIPConfig {
  certificado: string; // Contenido del certificado en base64
  clavePrivada: string; // Clave privada en base64
  cuit: string; // CUIT del usuario (sin guiones)
  puntoVenta: number;
  ambiente: 'produccion' | 'testing';
}

export interface CreateInvoiceParams {
  userId: number;
  tipo: 'A' | 'B' | 'C' | 'E';
  concepto?: string;
  monto: number;
  cliente?: {
    razonSocial: string;
    tipoDocumento: number;
    numeroDocumento: string;
    pais?: string;
    moneda?: string;
  };
}
