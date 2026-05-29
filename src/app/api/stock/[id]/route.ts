import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function getSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const userName = cookieStore.get('userName')?.value;
  const role = cookieStore.get('userRole')?.value;
  return { userId, userName, role };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId, userName, role } = await getSession();

    if (!userId || !userName) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }, { status: 401 });
    }

    const body = await request.json();
    const { quantity, note } = body;

    if (quantity === undefined) {
      return NextResponse.json({ error: 'กรุณากรอกจำนวนสินค้า' }, { status: 400 });
    }

    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum < 0) {
      return NextResponse.json({ error: 'จำนวนสินค้าไม่ถูกต้อง' }, { status: 400 });
    }

    const original = await prisma.stockCount.findUnique({
      where: { id },
    });

    if (!original) {
      return NextResponse.json({ error: 'ไม่พบรายการตรวจนับสต็อก' }, { status: 404 });
    }

    if (original.status !== 'PENDING') {
      return NextResponse.json({ error: 'ไม่สามารถแก้ไขรายการที่ได้รับการอนุมัติแล้วได้' }, { status: 400 });
    }

    if (original.userId !== userId && role !== 'OWNER') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไขรายการของพนักงานคนอื่น' }, { status: 403 });
    }

    const oldValue = JSON.stringify({ quantity: original.quantity, note: original.note });
    const newValue = JSON.stringify({ quantity: qtyNum, note: note || null });

    await prisma.auditLog.create({
      data: {
        stockCountId: id,
        action: 'EDIT',
        oldValue,
        newValue,
        performedBy: userName,
      },
    });

    const updated = await prisma.stockCount.update({
      where: { id },
      data: {
        quantity: qtyNum,
        note: note || null,
      },
    });

    return NextResponse.json({ success: true, stockCount: updated });
  } catch (error: any) {
    console.error('API PUT /api/stock/[id] error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update stock count' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId, userName, role } = await getSession();

    if (!userId || !userName) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }, { status: 401 });
    }

    const original = await prisma.stockCount.findUnique({
      where: { id },
    });

    if (!original) {
      return NextResponse.json({ error: 'ไม่พบรายการตรวจนับสต็อก' }, { status: 404 });
    }

    if (original.status !== 'PENDING') {
      return NextResponse.json({ error: 'ไม่สามารถลบรายการที่ได้รับการอนุมัติแล้วได้' }, { status: 400 });
    }

    if (original.userId !== userId && role !== 'OWNER') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ลบรายการของพนักงานคนอื่น' }, { status: 403 });
    }

    const oldValue = JSON.stringify(original);
    
    await prisma.auditLog.create({
      data: {
        stockCountId: id,
        action: 'DELETE',
        oldValue,
        newValue: '{}',
        performedBy: userName,
      },
    });

    await prisma.stockCount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API DELETE /api/stock/[id] error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete stock count' }, { status: 500 });
  }
}
