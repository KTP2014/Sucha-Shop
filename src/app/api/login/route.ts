import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { role, pin } = await request.json();

    if (!role || !pin) {
      return NextResponse.json({ error: 'กรุณากรอกบทบาทและรหัส PIN' }, { status: 400 });
    }

    // 1. Query the User in SQLite
    const user = await prisma.user.findFirst({
      where: {
        pin: pin,
        role: role.toUpperCase(),
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'รหัส PIN ไม่ถูกต้อง หรือบัญชีของคุณถูกระงับการใช้งาน' },
        { status: 401 }
      );
    }

    // 2. Prepare NextResponse with user data
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
    
    // Cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week session
    };

    // 3. Set cookies directly on response.cookies (perfectly guaranteed delivery in Next.js)
    response.cookies.set('userId', user.id, cookieOptions);
    response.cookies.set('userRole', user.role, cookieOptions);
    response.cookies.set('userName', user.name, cookieOptions);

    return response;
  } catch (error: any) {
    console.error('API /api/login error:', error);
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
      { status: 500 }
    );
  }
}
