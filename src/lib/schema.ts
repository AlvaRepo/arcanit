import { pgTable, serial, varchar, integer, timestamp, boolean, text, numeric } from 'drizzle-orm/pg-core';

// Usuarios
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  cuit: varchar('cuit', { length: 11 }),
  puntoVenta: integer('punto_venta'),
  configCompleta: boolean('config_completa').default(false),
  certificado: text('certificado'),
  clavePrivada: text('clave_privada'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Sesiones
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  usuarioId: integer('usuario_id').notNull().references(() => users.id),
  token: varchar('token', { length: 255 }).notNull().unique(),
  dispositivo: varchar('dispositivo', { length: 255 }),
  ip: varchar('ip', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
});

// Clientes
export const clientes = pgTable('clientes', {
  id: serial('id').primaryKey(),
  usuarioId: integer('usuario_id').notNull().references(() => users.id),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  tipo: varchar('tipo', { length: 50 }).notNull(), // streaming, sponsor-ri, sponsor-consumidor, general
  tipoDocumento: integer('tipo_documento'), // 80=CUIT, 96=DNI, 86=CUIL
  numeroDocumento: varchar('numero_documento', { length: 20 }),
  razonSocial: varchar('razon_social', { length: 255 }),
  pais: varchar('pais', { length: 10 }), // US, UK, DE, etc
  moneda: varchar('moneda', { length: 10 }), // USD, EUR, ARS
  tipoFactura: varchar('tipo_factura', { length: 1 }), // A, B, C, E
  createdAt: timestamp('created_at').defaultNow(),
});

// Facturas
export const facturas = pgTable('facturas', {
  id: serial('id').primaryKey(),
  usuarioId: integer('usuario_id').notNull().references(() => users.id),
  clienteId: integer('cliente_id').references(() => clientes.id),
  numero: integer('numero').notNull(),
  tipo: varchar('tipo', { length: 10 }).notNull(), // Factura A, B, C, E
  tipoLetra: varchar('tipo_letra', { length: 1 }).notNull(), // A, B, C, E
  concepto: varchar('concepto', { length: 255 }),
  monto: numeric('monto', { precision: 12, scale: 2 }).notNull(),
  montoNeto: numeric('monto_neto', { precision: 12, scale: 2 }),
  montoIVA: numeric('monto_iva', { precision: 12, scale: 2 }),
  clienteDocTipo: integer('cliente_doc_tipo'),
  clienteDocNro: varchar('cliente_doc_nro', { length: 20 }),
  clienteRazonSocial: varchar('cliente_razon_social', { length: 255 }),
  clientePais: varchar('cliente_pais', { length: 10 }),
  clienteMoneda: varchar('cliente_moneda', { length: 10 }),
  cae: varchar('cae', { length: 50 }),
  caeVencimiento: timestamp('cae_vencimiento'),
  resultado: varchar('resultado', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Notas de crédito/débito
export const notas = pgTable('notas', {
  id: serial('id').primaryKey(),
  usuarioId: integer('usuario_id').notNull().references(() => users.id),
  numero: integer('numero').notNull(),
  tipo: varchar('tipo', { length: 20 }).notNull(), // credito, debito
  tipoLetra: varchar('tipo_letra', { length: 1 }).notNull(), // A, B, C, E
  motivo: varchar('motivo', { length: 50 }).notNull(),
  monto: numeric('monto', { precision: 12, scale: 2 }).notNull(),
  montoNeto: numeric('monto_neto', { precision: 12, scale: 2 }),
  montoIVA: numeric('monto_iva', { precision: 12, scale: 2 }),
  cae: varchar('cae', { length: 50 }),
  caeVencimiento: timestamp('cae_vencimiento'),
  resultado: varchar('resultado', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Facturas recurrentes
export const recurrentes = pgTable('recurrentes', {
  id: serial('id').primaryKey(),
  usuarioId: integer('usuario_id').notNull().references(() => users.id),
  clienteId: integer('cliente_id').references(() => clientes.id),
  clienteNombre: varchar('cliente_nombre', { length: 255 }).notNull(),
  monto: numeric('monto', { precision: 12, scale: 2 }).notNull(),
  tipoFactura: varchar('tipo_factura', { length: 1 }).notNull(),
  frecuencia: varchar('frecuencia', { length: 20 }).notNull(), // semanal, quincenal, mensual
  fechaInicio: timestamp('fecha_inicio').notNull(),
  proximaFecha: timestamp('proxima_fecha').notNull(),
  activa: boolean('activa').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Types infer
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Cliente = typeof clientes.$inferSelect;
export type NewCliente = typeof clientes.$inferInsert;
export type Factura = typeof facturas.$inferSelect;
export type NewFactura = typeof facturas.$inferInsert;
export type Nota = typeof notas.$inferSelect;
export type NewNota = typeof notas.$inferInsert;
export type Recurrente = typeof recurrentes.$inferSelect;
export type NewRecurrente = typeof recurrentes.$inferInsert;
