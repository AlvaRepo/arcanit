// ============================================================
// SISTEMA DE SESIONES con PostgreSQL/Neon
// Persiste entre reinicios
// ============================================================

import { db, sql } from './db';
import { sessions, users } from './schema';
import { eq, and, gt } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Generar token de sesión
export async function createSession(userId: number): Promise<{ token: string; expiresAt: Date }> {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
  
  // Eliminar sesiones anteriores del usuario (anti-sharing)
  await db.delete(sessions)
    .where(eq(sessions.usuarioId, userId));
  
  // Insertar nueva sesión
  await db.insert(sessions)
    .values({
      usuarioId: userId,
      token,
      expiresAt,
    });
  
  return { token, expiresAt };
}

// Verificar si un token de sesión es válido
export async function verifySession(token: string): Promise<number | null> {
  const result = await db.select()
    .from(sessions)
    .where(
      and(
        eq(sessions.token, token),
        gt(sessions.expiresAt, new Date())
      )
    );
  
  if (!result || result.length === 0) {
    return null;
  }
  
  return result[0].usuarioId;
}

// Eliminar sesión (logout)
export async function destroySession(token: string): Promise<void> {
  await db.delete(sessions)
    .where(eq(sessions.token, token));
}

// Eliminar todas las sesiones de un usuario (anti-sharing)
export async function destroyUserSessions(userId: number): Promise<void> {
  await db.delete(sessions)
    .where(eq(sessions.usuarioId, userId));
}

// Obtener usuario desde request (busca en cookies)
export async function getUserIdFromRequest(request: Request): Promise<number | null> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split('; ').find(c => c.startsWith('session='));
  if (!cookies) return null;
  
  const token = cookies.split('=')[1];
  if (!token) return null;
  
  return verifySession(token);
}

// Obtener usuario por email (para login)
export async function getUserByEmail(email: string) {
  const result = await db.select()
    .from(users)
    .where(eq(users.email, email));
  
  return result[0] || null;
}
