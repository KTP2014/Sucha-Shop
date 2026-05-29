import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get('userRole')?.value;

    if (role !== 'OWNER') {
      return NextResponse.json({ error: 'สิทธิ์การเข้าถึงไม่ถูกต้องเฉพาะเจ้าของร้านเท่านั้น' }, { status: 403 });
    }

    const auditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ auditLogs });
  } catch (error: any) {
    console.error('API GET /api/owner/audit error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch audit logs' }, { status: 500 });
  }
}
