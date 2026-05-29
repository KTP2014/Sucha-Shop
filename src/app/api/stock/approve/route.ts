import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStores, updateInventory } from '@/lib/loyverse';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing stock count ID' }, { status: 400 });
    }

    const stockCount = await prisma.stockCount.findUnique({
      where: { id },
    });

    if (!stockCount) {
      return NextResponse.json({ error: 'Stock count record not found' }, { status: 404 });
    }

    if (stockCount.status !== 'PENDING') {
      return NextResponse.json({ error: 'Record is already processed' }, { status: 400 });
    }

    const stores = await getStores();
    if (stores.length === 0) {
      return NextResponse.json({ error: 'No stores found in your Loyverse account' }, { status: 500 });
    }
    const store = stores[0];

    // Sync counted stock_after
    await updateInventory(stockCount.variantId, store.id, stockCount.quantity);

    const updatedCount = await prisma.stockCount.update({
      where: { id },
      data: {
        status: 'SYNCED',
        storeId: store.id,
        storeName: store.name,
        syncedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, stockCount: updatedCount });
  } catch (error: any) {
    console.error('API POST /api/stock/approve error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve and sync stock count to Loyverse' },
      { status: 500 }
    );
  }
}
