import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function verifyOwner() {
  const cookieStore = await cookies();
  const role = cookieStore.get('userRole')?.value;
  return role === 'OWNER';
}

export async function GET() {
  try {
    if (!(await verifyOwner())) {
      return NextResponse.json({ error: 'สิทธิ์การเข้าถึงไม่ถูกต้องเฉพาะเจ้าของร้านเท่านั้น' }, { status: 403 });
    }

    const staffList = await prisma.user.findMany({
      where: { role: 'STAFF' },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ staffList });
  } catch (error: any) {
    console.error('API GET /api/owner/staff error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch staff list' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await verifyOwner())) {
      return NextResponse.json({ error: 'สิทธิ์การเข้าถึงไม่ถูกต้องเฉพาะเจ้าของร้านเท่านั้น' }, { status: 403 });
    }

    const { name, pin } = await request.json();

    if (!name || !pin) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อและรหัส PIN' }, { status: 400 });
    }

    if (pin.length !== 4 || isNaN(Number(pin))) {
      return NextResponse.json({ error: 'รหัส PIN ต้องเป็นตัวเลข 4 หลักเท่านั้น' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { pin },
    });

    if (existing) {
      return NextResponse.json({ error: 'รหัส PIN นี้ถูกใช้งานแล้ว กรุณาใช้รหัสอื่น' }, { status: 400 });
    }

    const newStaff = await prisma.user.create({
      data: {
        name,
        pin,
        role: 'STAFF',
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, staff: newStaff });
  } catch (error: any) {
    console.error('API POST /api/owner/staff error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create staff member' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await verifyOwner())) {
      return NextResponse.json({ error: 'สิทธิ์การเข้าถึงไม่ถูกต้องเฉพาะเจ้าของร้านเท่านั้น' }, { status: 403 });
    }

    const { id, name, pin, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ไม่พบ ID พนักงานที่ต้องการแก้ไข' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    if (pin !== undefined) {
      if (pin.length !== 4 || isNaN(Number(pin))) {
        return NextResponse.json({ error: 'รหัส PIN ต้องเป็นตัวเลข 4 หลักเท่านั้น' }, { status: 400 });
      }
      
      const existing = await prisma.user.findFirst({
        where: {
          pin,
          id: { not: id },
        },
      });
      
      if (existing) {
        return NextResponse.json({ error: 'รหัส PIN นี้ถูกใช้งานโดยพนักงานคนอื่นแล้ว' }, { status: 400 });
      }
      
      updateData.pin = pin;
    }

    const updatedStaff = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, staff: updatedStaff });
  } catch (error: any) {
    console.error('API PUT /api/owner/staff error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update staff member' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await verifyOwner())) {
      return NextResponse.json({ error: 'สิทธิ์การเข้าถึงไม่ถูกต้องเฉพาะเจ้าของร้านเท่านั้น' }, { status: 403 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ไม่พบ ID พนักงานที่ต้องการลบ' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API DELETE /api/owner/staff error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete staff member' }, { status: 500 });
  }
}
