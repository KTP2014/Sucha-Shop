'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, LogOut, Package, Search, PlusCircle, Calendar, RefreshCw, X,
  ShieldAlert, CheckCircle2, FileText, Trash2, Edit3, Save, ChevronRight,
  AlertCircle, ShoppingBag, Eye
} from 'lucide-react';

interface StaffDashboardProps {
  userId: string;
  userName: string;
}

interface LoyverseVariant {
  variant_id: string;
  item_id: string;
  sku: string | null;
  option1_value: string | null;
  option2_value: string | null;
  option3_value: string | null;
  cost: number;
}

interface LoyverseItem {
  id: string;
  item_name: string;
  description: string | null;
  category_id: string | null;
  variants: LoyverseVariant[];
}

interface FlatVariant {
  itemId: string;
  itemName: string;
  variantId: string;
  variantName: string;
  sku: string | null;
  displayName: string;
}

interface StockCount {
  id: string;
  itemId: string;
  itemName: string;
  variantId: string;
  variantName: string;
  sku: string | null;
  quantity: number;
  note: string | null;
  status: string; // PENDING, SYNCED
  createdBy: string;
  userId: string | null;
  storeId: string | null;
  storeName: string | null;
  createdAt: string;
  syncedAt: string | null;
}

export default function StaffDashboard({ userId, userName }: StaffDashboardProps) {
  const router = useRouter();

  // Loyverse items & variants list states
  const [items, setItems] = useState<LoyverseItem[]>([]);
  const [flatVariants, setFlatVariants] = useState<FlatVariant[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(true);

  // Stock count history states
  const [stockCounts, setStockCounts] = useState<StockCount[]>([]);
  const [loadingCounts, setLoadingCounts] = useState<boolean>(true);

  // Form states
  const [selectedVariant, setSelectedVariant] = useState<FlatVariant | null>(null);
  const [quantity, setQuantity] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Dialog/Modal states
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Edit Modal states
  const [editingCount, setEditingCount] = useState<StockCount | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Message feedback states
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Filtering states
  const [activeTab, setActiveTab] = useState<'MY_LIST' | 'ALL_LIST'>('MY_LIST');
  const [filterDate, setFilterDate] = useState<string>('');

  // Initial data loading
  useEffect(() => {
    fetchItems();
    fetchStockCounts();
  }, []);

  const fetchItems = async () => {
    try {
      setLoadingItems(true);
      const res = await fetch('/api/items');
      if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลรายการสินค้าจาก Loyverse ได้');
      
      const data = await res.json();
      const loyverseItems: LoyverseItem[] = data.items || [];
      setItems(loyverseItems);

      // Flatten items into specific variants for seamless searching
      const flat: FlatVariant[] = [];
      loyverseItems.forEach((item) => {
        if (item.variants && item.variants.length > 0) {
          item.variants.forEach((v) => {
            const options = [v.option1_value, v.option2_value, v.option3_value]
              .filter(Boolean)
              .join(' / ');
            const displayName = options ? `${item.item_name} (${options})` : item.item_name;
            flat.push({
              itemId: item.id,
              itemName: item.item_name,
              variantId: v.variant_id,
              variantName: options || 'Default',
              sku: v.sku,
              displayName,
            });
          });
        }
      });
      setFlatVariants(flat);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'เกิดข้อผิดพลาดขณะดึงรายการสินค้า');
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchStockCounts = async () => {
    try {
      setLoadingCounts(true);
      const res = await fetch('/api/stock');
      if (!res.ok) throw new Error('ไม่สามารถดึงประวัติการนับสต็อกได้');
      const data = await res.json();
      setStockCounts(data.stockCounts || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingCounts(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) {
      setError('กรุณาเลือกสินค้าก่อนส่งบันทึก');
      return;
    }
    if (!quantity || parseInt(quantity, 10) < 0) {
      setError('กรุณากรอกจำนวนสินค้าที่ถูกต้อง (จำนวนมากกว่าหรือเท่ากับ 0)');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: selectedVariant.itemId,
          itemName: selectedVariant.itemName,
          variantId: selectedVariant.variantId,
          variantName: selectedVariant.variantName,
          sku: selectedVariant.sku,
          quantity: parseInt(quantity, 10),
          note: note.trim() || null,
          type: 'COUNT',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการส่งข้อมูล');
      }

      setSuccess('บันทึกข้อมูลและส่งรายงานการตรวจนับสำเร็จ!');
      // Clear form
      setSelectedVariant(null);
      setQuantity('');
      setNote('');
      
      // Refresh count list
      await fetchStockCounts();
      
      // Clear success feedback after 4 seconds
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถส่งข้อมูลได้');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนับสต็อกนี้?')) return;
    
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/stock/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'ไม่สามารถลบรายการได้');
      }
      setSuccess('ลบรายการตรวจนับสต็อกสำเร็จ');
      await fetchStockCounts();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการลบ');
    }
  };

  const handleOpenEdit = (count: StockCount) => {
    setEditingCount(count);
    setEditQuantity(count.quantity.toString());
    setEditNote(count.note || '');
    setError('');
  };

  const handleSaveEdit = async () => {
    if (!editingCount) return;
    const qty = parseInt(editQuantity, 10);
    if (isNaN(qty) || qty < 0) {
      setError('กรุณากรอกจำนวนที่ถูกต้อง');
      return;
    }

    setSavingEdit(true);
    setError('');
    try {
      const res = await fetch(`/api/stock/${editingCount.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: qty,
          note: editNote.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'ไม่สามารถแก้ไขข้อมูลได้');
      }

      setSuccess('แก้ไขข้อมูลรายการตรวจนับเรียบร้อยแล้ว');
      setEditingCount(null);
      await fetchStockCounts();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกแก้ไข');
    } finally {
      setSavingEdit(false);
    }
  };

  // Filter products matching search bar
  const filteredVariants = flatVariants.filter((v) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      v.displayName.toLowerCase().includes(query) ||
      (v.sku && v.sku.toLowerCase().includes(query))
    );
  });

  // Filter history counts according to selected tab & date picker
  const filteredCounts = stockCounts.filter((c) => {
    // 1. Tab check
    if (activeTab === 'MY_LIST') {
      if (c.userId !== userId) return false;
    }

    // 2. Date check (Local timezone date comparison)
    if (filterDate) {
      const cDate = new Date(c.createdAt).toLocaleDateString('en-CA');
      if (cDate !== filterDate) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12">
      {/* Navbar Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="text-blue-400" size={18} />
            <span className="font-bold text-sm">นับสต็อกสินค้า (Staff)</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-300 font-medium flex items-center space-x-1">
              <User size={13} className="text-slate-400" />
              <span>{userName}</span>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-slate-300 hover:text-white text-xs bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              <LogOut size={13} />
              <span>ออกระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-md mx-auto px-4 mt-6 space-y-6">
        {/* Welcome Section */}
        <section className="bg-gradient-to-r from-slate-900 to-slate-850 text-white p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded font-bold uppercase">Staff Session</span>
          <h1 className="text-xl font-bold pt-1">สวัสดีคุณ {userName} 👋</h1>
          <p className="text-slate-400 text-xs">
            กรุณาใช้แบบฟอร์มด้านล่างเพื่อบันทึกและตรวจสอบจำนวนสต็อกเสื้อผ้าในร้านจริง
          </p>
        </section>

        {/* Notifications */}
        {success && (
          <div className="flex items-center space-x-2 text-green-700 bg-green-50 p-4 rounded-xl text-xs font-semibold border border-green-100">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 text-red-750 bg-red-50 p-4 rounded-xl text-xs border border-red-100 font-medium">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form to submit stock count */}
        <section className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <PlusCircle size={15} className="text-blue-500" />
            รายงานตรวจนับยอดสต็อกสินค้า
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Searchable selector button */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">เลือกสินค้าและไซส์/สี *</label>
              
              {selectedVariant ? (
                <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-900 font-bold text-sm leading-tight">
                        {selectedVariant.itemName}
                      </p>
                      <p className="text-blue-600 text-xs font-bold mt-1">
                        ตัวเลือก: {selectedVariant.variantName}
                      </p>
                      {selectedVariant.sku && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          SKU: {selectedVariant.sku}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedVariant(null)}
                      className="text-xs text-slate-400 hover:text-red-500 font-semibold p-1"
                    >
                      ล้าง
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchModalOpen(true);
                    }}
                    className="w-full py-1.5 bg-white border border-blue-200 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 transition"
                  >
                    เปลี่ยนสินค้า
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchModalOpen(true);
                  }}
                  disabled={loadingItems}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 rounded-xl transition duration-150 text-left"
                >
                  <span className="text-slate-400 text-xs font-medium">
                    {loadingItems ? 'กำลังดาวน์โหลดรายการสินค้า...' : 'คลิกเพื่อเลือกสินค้าจาก Loyverse...'}
                  </span>
                  <ChevronRight size={16} className="text-slate-400" />
                </button>
              )}
            </div>

            {/* Quantity Input */}
            <div className="space-y-1.5">
              <label htmlFor="qty" className="text-xs font-bold text-slate-700 block">
                จำนวนที่นับได้จริง (ชิ้น) *
              </label>
              <input
                id="qty"
                type="number"
                min="0"
                placeholder="กรอกจำนวนสินค้าเป็นตัวเลข เช่น 15"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-800 transition"
              />
            </div>

            {/* Notes/Remarks */}
            <div className="space-y-1.5">
              <label htmlFor="notes" className="text-xs font-bold text-slate-700 block">
                หมายเหตุ / คำอธิบายเพิ่มเติม
              </label>
              <textarea
                id="notes"
                rows={2}
                placeholder="ระบุกรณีสินค้าชำรุด, มีตำหนิ, ป้ายราคาหลุด หรือเหตุผลอื่นๆ (ถ้ามี)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-800 transition resize-none"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting || !selectedVariant}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition duration-200 active:scale-[0.98] shadow-sm flex items-center justify-center space-x-1.5"
            >
              {submitting ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>กำลังบันทึกข้อมูล...</span>
                </>
              ) : (
                <>
                  <PlusCircle size={14} />
                  <span>ส่งรายการนับสต็อก</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* Date Filter */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-100 flex items-center justify-between gap-3 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 shrink-0">
            <Calendar size={14} className="text-slate-400" />
            กรองตามวันที่นับ:
          </span>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 w-full"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1.5 rounded font-bold shrink-0"
            >
              ล้าง
            </button>
          )}
        </div>

        {/* History Tabs Section */}
        <section className="space-y-3">
          <div className="flex bg-slate-200/60 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('MY_LIST')}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition ${
                activeTab === 'MY_LIST'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-850'
              }`}
            >
              รายการของฉัน
            </button>
            <button
              onClick={() => setActiveTab('ALL_LIST')}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition ${
                activeTab === 'ALL_LIST'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-850'
              }`}
            >
              รายการทั้งหมด
            </button>
          </div>

          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {activeTab === 'MY_LIST' ? 'ประวัติของฉันที่รออนุมัติ / ซิงค์แล้ว' : 'รายการตรวจนับของพนักงานทั้งหมด'}
            </h3>
            <button
              onClick={fetchStockCounts}
              className="text-slate-500 hover:text-slate-800 p-1 flex items-center space-x-1 text-xs"
            >
              <RefreshCw size={12} className={loadingCounts ? 'animate-spin' : ''} />
              <span>รีเฟรช</span>
            </button>
          </div>

          {/* Counts Listing */}
          {loadingCounts ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-2">
              <RefreshCw size={22} className="animate-spin text-slate-400" />
              <p className="text-xs text-slate-500">กำลังดึงข้อมูลประวัติ...</p>
            </div>
          ) : filteredCounts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-100 text-xs">
              ไม่พบข้อมูลประวัติสต็อกตรงตามเงื่อนไขที่เลือก
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCounts.map((count) => {
                const formattedTime = new Date(count.createdAt).toLocaleString('th-TH', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={count.id}
                    className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-3"
                  >
                    {/* Display Item details */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-900 text-sm">{count.itemName}</h4>
                        <p className="text-slate-500 text-xs">ไซส์/ตัวเลือก: {count.variantName}</p>
                        {count.sku && (
                          <p className="text-[10px] text-slate-400 font-mono">SKU: {count.sku}</p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          count.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-600 border border-amber-200'
                            : 'bg-green-50 text-green-600 border border-green-200'
                        }`}
                      >
                        {count.status === 'PENDING' ? 'รอยืนยัน' : 'ซิงค์สำเร็จ'}
                      </span>
                    </div>

                    {/* Numeric details and audit info */}
                    <div className="grid grid-cols-2 gap-3 py-2 border-y border-slate-50 text-xs">
                      <div>
                        <p className="text-slate-400 text-[10px]">นับได้จริง</p>
                        <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                          {count.quantity} ชิ้น
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[10px]">ผู้บันทึก / วันที่</p>
                        <p className="font-semibold text-slate-700 mt-0.5 text-xs">
                          {count.createdBy}
                        </p>
                        <p className="text-[9px] text-slate-400">{formattedTime} น.</p>
                      </div>
                    </div>

                    {/* Show comments if any */}
                    {count.note && (
                      <div className="bg-slate-50 p-2.5 rounded-xl text-[10px] text-slate-600 flex items-start space-x-1.5 border border-slate-100">
                        <FileText size={12} className="text-slate-400 shrink-0 mt-0.5" />
                        <span>หมายเหตุ: {count.note}</span>
                      </div>
                    )}

                    {/* Actions for PENDING counts belonging to the logged-in staff */}
                    {count.status === 'PENDING' && count.userId === userId && (
                      <div className="flex justify-end space-x-2 pt-1 border-t border-slate-50">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(count)}
                          className="flex items-center space-x-1 bg-blue-50 text-blue-600 border border-blue-150 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                        >
                          <Edit3 size={11} />
                          <span>แก้ไข</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(count.id)}
                          className="flex items-center space-x-1 bg-red-50 text-red-650 border border-red-150 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                        >
                          <Trash2 size={11} />
                          <span>ลบ</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* SEARCH PRODUCT MODAL */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md flex flex-col max-h-[85vh] shadow-xl overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-2">
                <Package size={18} className="text-blue-400" />
                <h3 className="font-bold text-sm">ค้นหาและเลือกสินค้า</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search input */}
            <div className="p-4 border-b border-slate-100 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="พิมพ์ค้นหา ชื่อสินค้า หรือ SKU เช่น เสื้อยืด..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 transition"
                  autoFocus
                />
              </div>
            </div>

            {/* Flat variant list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
              {loadingItems ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-2">
                  <RefreshCw size={22} className="animate-spin text-slate-400" />
                  <p className="text-xs text-slate-500">กำลังโหลดรายการสินค้า...</p>
                </div>
              ) : filteredVariants.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  ไม่พบสินค้าที่ตรงกับการค้นหา "{searchQuery}"
                </div>
              ) : (
                filteredVariants.map((v) => (
                  <button
                    key={v.variantId}
                    type="button"
                    onClick={() => {
                      setSelectedVariant(v);
                      setIsSearchModalOpen(false);
                      setError('');
                    }}
                    className="w-full text-left p-3.5 bg-white hover:bg-blue-50 border border-slate-150 hover:border-blue-200 rounded-xl transition duration-100 flex flex-col space-y-1"
                  >
                    <span className="font-bold text-slate-800 text-xs">{v.itemName}</span>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold w-full">
                      <span className="text-blue-600">ตัวเลือก: {v.variantName}</span>
                      {v.sku && <span className="font-mono text-slate-400">SKU: {v.sku}</span>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL FOR PENDING COUNTS */}
      {editingCount && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm flex flex-col shadow-xl overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-2">
                <Edit3 size={16} className="text-blue-400" />
                <h3 className="font-bold text-sm">แก้ไขรายการนับสต็อก</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCount(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div className="space-y-0.5 text-xs">
                <span className="text-slate-400 font-bold block">สินค้าที่แก้ไข:</span>
                <span className="font-bold text-slate-800 text-sm block">{editingCount.itemName}</span>
                <span className="text-blue-600 block">ไซส์/ตัวเลือก: {editingCount.variantName}</span>
              </div>

              {/* Number Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">จำนวนที่นับได้จริง *</label>
                <input
                  type="number"
                  min="0"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Textarea note */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">หมายเหตุเพิ่มเติม</label>
                <textarea
                  rows={2}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none"
                  placeholder="ป้อนหมายเหตุเพิ่มเติม..."
                />
              </div>

              {/* Buttons */}
              <div className="flex space-x-2 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setEditingCount(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center justify-center space-x-1.5"
                >
                  {savingEdit ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <Save size={13} />
                      <span>บันทึกแก้ไข</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
