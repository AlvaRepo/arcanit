import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Neon PostgreSQL para producción
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;
export type Cliente = typeof schema.clientes.$inferSelect;
export type NewCliente = typeof schema.clientes.$inferInsert;
export type Factura = typeof schema.facturas.$inferSelect;
export type NewFactura = typeof schema.facturas.$inferInsert;
export type Nota = typeof schema.notas.$inferSelect;
export type NewNota = typeof schema.notas.$inferInsert;
export type Recurrente = typeof schema.recurrentes.$inferSelect;
export type NewRecurrente = typeof schema.recurrentes.$inferInsert;

// No necesita initDB() — las tablas se crean con drizzle-kit
