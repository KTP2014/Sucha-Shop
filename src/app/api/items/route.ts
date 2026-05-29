import { NextResponse } from 'next/server';
import { getItems } from '@/lib/loyverse';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await getItems();
    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('API /api/items error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch items from Loyverse' },
      { status: 500 }
    );
  }
}
