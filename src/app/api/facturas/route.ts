// Este archivo ya no se usa - la lógica está en nueva/route.ts
// Solo redirectionamos a nueva/route
import { NextResponse } from 'next/server';

// Redirect /api/facturas -> /api/facturas/nueva
export async function GET() {
  return NextResponse.json({ message: 'Use /api/facturas/nueva' });
}