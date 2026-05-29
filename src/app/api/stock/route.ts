import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET all stock counts, including user details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where = status ? { status } : {};
    const stockCounts = await prisma.stockCount.findMany({
      where,
      include: {
        user: true, // Fetch related user details
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ stockCounts });
  } catch (error: any) {
    console.error('API GET /api/stock error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch stock counts' }, { status: 500 });
  }
}

// POST a new pending stock count (reads userId and userName securely from cookies)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    const userName = cookieStore.get('userName')?.value;
    const role = cookieStore.get('userRole')?.value;

    // Enforce authentication check on the server-side
    if (!userId || !userName || (role !== 'STAFF' && role !== 'OWNER')) {
      return NextResponse.json({ error: 'สิทธิ์การเข้าถึงไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่' }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, itemName, variantId, variantName, sku, quantity, note, type } = body;

    if (!itemId || !itemName || !variantId || !variantName || quantity === undefined) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' }, { status: 400 });
    }

    const newCount = await prisma.stockCount.create({
      data: {
        itemId,
        itemName,
        variantId,
        variantName,
        sku: sku || null,
        quantity: parseInt(quantity, 10),
        note: note || null,
        type: type || 'COUNT', // default is COUNT, can be ADJUST
        status: 'PENDING',
        createdBy: userName,  // Securely logs current user's name
        userId: userId,       // Securely links current user's id
      },
    });

    return NextResponse.json({ success: true, stockCount: newCount });
  } catch (error: any) {
    console.error('API POST /api/stock error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save stock count' }, { status: 500 });
  }
}
