// ============================================================
// SISTEMA DE SESIONES con SQLite
// Persiste entre reinicios
// ============================================================

import { db } from './db';
import { sessions, users } from './schema';
import { eq, and, gt } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Generar token de sesión
export function createSession(userId: number): { token: string; expiresAt: Date } {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
  
  // Eliminar sesiones anteriores del usuario (anti-sharing)
  db.delete(sessions)
    .where(eq(sessions.usuarioId, userId))
    .run();
  
  // Insertar nueva sesión
  db.insert(sessions)
    .values({
      usuarioId: userId,
      token,
      expiresAt: expiresAt.toISOString(),
    })
    .run();
  
  return { token, expiresAt };
}

// Verificar si un token de sesión es válido
export function verifySession(token: string): number | null {
  const result = db.select()
    .from(sessions)
    .where(
      and(
        eq(sessions.token, token),
        gt(sessions.expiresAt, new Date().toISOString())
      )
    )
    .get() as any;
  
  if (!result) {
    return null;
  }
  
  return result.usuarioId;
}

// Eliminar sesión (logout)
export function destroySession(token: string): void {
  db.delete(sessions)
    .where(eq(sessions.token, token))
    .run();
}

// Eliminar todas las sesiones de un usuario (anti-sharing)
export function destroyUserSessions(userId: number): void {
  db.delete(sessions)
    .where(eq(sessions.usuarioId, userId))
    .run();
}

// Obtener usuario desde request (busca en cookies)
export function getUserIdFromRequest(request: Request): number | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split('; ').find(c => c.startsWith('session='));
  if (!cookies) return null;
  
  const token = cookies.split('=')[1];
  if (!token) return null;
  
  return verifySession(token);
}

// Obtener usuario por email (para login)
export function getUserByEmail(email: string) {
  return db.select()
    .from(users)
    .where(eq(users.email, email))
    .get() as any;
}
