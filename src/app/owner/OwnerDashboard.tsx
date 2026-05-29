'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, LogOut, CheckCircle2, AlertCircle, RefreshCw, 
  Check, History, Users, Calendar, FileText, User 
} from 'lucide-react';

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
  storeId: string | null;
  storeName: string | null;
  createdAt: string;
  syncedAt: string | null;
}

interface AuditLog {
  id: string;
  stockCountId: string;
  action: string;
  oldValue: string;
  newValue: string;
  performedBy: string;
  createdAt: string;
}

export default function OwnerDashboard() {
  const router = useRouter();
  
  const [stockCounts, setStockCounts] = useState<StockCount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAudits, setLoadingAudits] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // State for specific items being approved
  const [approvingIds, setApprovingIds] = useState<Record<string, boolean>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Filter state
  const [filterStatus, setFilterStatus] = useState<'PENDING' | 'SYNCED' | 'AUDIT' | 'ALL'>('PENDING');
  const [filterDate, setFilterDate] = useState<string>('');

  useEffect(() => {
    fetchStockCounts();
    fetchAuditLogs();
  }, []);

  const fetchStockCounts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch('/api/stock');
      if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลประวัติการตรวจนับสต็อกได้');
      
      const data = await res.json();
      setStockCounts(data.stockCounts || []);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoadingAudits(true);
      const res = await fetch('/api/owner/audit');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoadingAudits(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleApprove = async (id: string) => {
    setApprovingIds(prev => ({ ...prev, [id]: true }));
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/stock/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'เกิดข้อผิดพลาดขณะอัปเดตข้อมูลไปยัง Loyverse');
      }

      setSuccessMessage('อัปเดตข้อมูลจำนวนสินค้าจริงเข้าสู่ระบบ Loyverse สำเร็จ!');
      await fetchStockCounts(); // refresh listing
      
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถซิงค์สต็อกเข้าสู่ Loyverse ได้');
    } finally {
      setApprovingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  // Filtered list
  const filteredCounts = stockCounts.filter(count => {
    if (filterStatus !== 'ALL' && count.status !== filterStatus) {
      return false;
    }
    
    if (filterDate) {
      const countDateStr = new Date(count.createdAt).toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
      if (countDateStr !== filterDate) return false;
    }

    return true;
  });

  // Filtered audits
  const filteredAudits = auditLogs.filter(log => {
    if (filterDate) {
      const logDateStr = new Date(log.createdAt).toLocaleDateString('en-CA');
      if (logDateStr !== filterDate) return false;
    }
    return true;
  });

  const pendingCount = stockCounts.filter(c => c.status === 'PENDING').length;

  const renderAuditDetails = (log: AuditLog) => {
    try {
      if (log.action === 'DELETE') {
        const data = JSON.parse(log.oldValue);
        return (
          <span className="text-red-700">
            ลบรายการนับสต็อกสินค้า <strong>{data.itemName}</strong> ({data.variantName}) จำนวนเดิม {data.quantity} ชิ้น
          </span>
        );
      } else if (log.action === 'EDIT') {
        const oldData = JSON.parse(log.oldValue);
        const newData = JSON.parse(log.newValue);
        const parts = [];
        
        if (oldData.quantity !== newData.quantity) {
          parts.push(`แก้ไขจำนวนจากเดิม ${oldData.quantity} ชิ้น &rarr; ${newData.quantity} ชิ้น`);
        }
        if (oldData.note !== newData.note) {
          parts.push(`หมายเหตุเปลี่ยนเป็น "${newData.note || '(ว่าง)'}"`);
        }

        return (
          <span className="text-blue-700">
            แก้ไขรายการตรวจนับ: <span dangerouslySetInnerHTML={{ __html: parts.join(' | ') }} />
          </span>
        );
      }
    } catch (e) {
      return <span>รายละเอียด: Action {log.action}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="text-purple-400" size={20} />
            <span className="font-bold text-sm">การอนุมัติสต็อก (Owner)</span>
          </div>
          <div className="flex items-center space-x-2">
            <Link 
              href="/owner/staff"
              className="flex items-center space-x-1 text-slate-300 hover:text-white text-xs bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              <Users size={13} />
              <span>พนักงาน</span>
            </Link>
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

      {/* Main Container */}
      <main className="max-w-md mx-auto px-4 mt-6 space-y-6">
        
        {/* Header summary */}
        <section className="bg-gradient-to-r from-slate-900 to-slate-850 text-white p-5 rounded-2xl shadow-sm space-y-2">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">แผงควบคุมร้านค้า</p>
          <div className="flex items-baseline space-x-2">
            <h1 className="text-2xl font-bold">{pendingCount} รายการ</h1>
            <span className="text-slate-300 text-xs">สต็อกรออนุมัติ</span>
          </div>
          <p className="text-slate-400 text-[10px]">
            เมื่ออนุมัติ ระบบจะซิงค์ข้อมูลจริงเข้าสู่ระบบ Loyverse อัตโนมัติ ( stock_after )
          </p>
        </section>

        {/* Action Feedbacks */}
        {successMessage && (
          <div className="flex items-center space-x-2 text-green-700 bg-green-50 p-4 rounded-xl text-xs font-medium border border-green-100">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 text-red-700 bg-red-50 p-4 rounded-xl text-xs border border-red-100">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Date picker filter */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-100 flex items-center justify-between gap-3 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 shrink-0">
            <Calendar size={14} className="text-slate-400" />
            กรองตามวันที่:
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
              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1.5 rounded"
            >
              ล้าง
            </button>
          )}
        </div>

        {/* Tab Filters */}
        <div className="flex bg-slate-200/60 p-1 rounded-xl">
          <button
            onClick={() => setFilterStatus('PENDING')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition ${
              filterStatus === 'PENDING'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            รอยืนยัน ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('SYNCED')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition ${
              filterStatus === 'SYNCED'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ซิงค์แล้ว
          </button>
          <button
            onClick={() => setFilterStatus('AUDIT')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition ${
              filterStatus === 'AUDIT'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ประวัติแก้ไข ({auditLogs.length})
          </button>
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition ${
              filterStatus === 'ALL'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ทั้งหมด
          </button>
        </div>

        {/* Dynamic List Section */}
        {filterStatus === 'AUDIT' ? (
          /* Render Audit Logs */
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">ประวัติการแก้ไขและลบสต็อก</h2>
              <button 
                onClick={fetchAuditLogs} 
                className="text-slate-500 hover:text-slate-800 p-1 flex items-center space-x-1 text-xs"
              >
                <RefreshCw size={12} className={loadingAudits ? 'animate-spin' : ''} />
                <span>รีเฟรช</span>
              </button>
            </div>

            {loadingAudits ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <RefreshCw size={24} className="animate-spin text-slate-400" />
                <p className="text-xs text-slate-500">กำลังดึงข้อมูล Audit Logs...</p>
              </div>
            ) : filteredAudits.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-100 text-xs">
                ยังไม่มีการบันทึกประวัติการแก้ไข/ลบรายการในระบบ
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAudits.map((log) => {
                  const formattedTime = new Date(log.createdAt).toLocaleString('th-TH', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div 
                      key={log.id} 
                      className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-center pb-1.5 border-b border-slate-50">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          log.action === 'EDIT' 
                            ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                            : 'bg-red-50 text-red-600 border border-red-200'
                        }`}>
                          {log.action === 'EDIT' ? 'แก้ไขรายการ' : 'ลบรายการ'}
                        </span>
                        <span className="text-[10px] text-slate-400">{formattedTime} น.</span>
                      </div>

                      <div className="text-xs text-slate-700 leading-relaxed font-medium">
                        {renderAuditDetails(log)}
                      </div>

                      <div className="text-[9px] text-slate-400 font-semibold text-right">
                        ดำเนินการโดย: {log.performedBy}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          /* Render Stock counts list */
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">รายการข้อมูลนับจริง</h2>
              <button 
                onClick={fetchStockCounts} 
                className="text-slate-500 hover:text-slate-800 p-1 flex items-center space-x-1 text-xs"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                <span>รีเฟรช</span>
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <RefreshCw size={24} className="animate-spin text-slate-400" />
                <p className="text-xs text-slate-500">กำลังดึงข้อมูลสต็อก...</p>
              </div>
            ) : filteredCounts.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-100 text-xs">
                ไม่มีรายการข้อมูลตรงตามตัวกรองในขณะนี้
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCounts.map((count) => {
                  const isSyncing = approvingIds[count.id] || false;
                  const formattedTime = new Date(count.createdAt).toLocaleString('th-TH', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div 
                      key={count.id}
                      className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-4"
                    >
                      {/* Header info */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h3 className="font-bold text-sm text-slate-900">{count.itemName}</h3>
                          <p className="text-slate-500 text-xs">{count.variantName}</p>
                          {count.sku && <p className="text-[10px] text-slate-400 font-mono">SKU: {count.sku}</p>}
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          count.status === 'PENDING' 
                            ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                            : 'bg-green-50 text-green-600 border border-green-200'
                        }`}>
                          {count.status === 'PENDING' ? 'รออนุมัติ' : 'ซิงค์สำเร็จ'}
                        </span>
                      </div>

                      {/* Meta info */}
                      <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-100 text-xs">
                        <div>
                          <p className="text-slate-400 text-[10px]">จำนวนที่นับได้จริง</p>
                          <p className="font-extrabold text-slate-900 text-base mt-0.5">{count.quantity} ชิ้น</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400 text-[10px]">ผู้ตรวจนับ / เวลา</p>
                          <p className="font-semibold text-slate-700 mt-0.5 text-xs">{count.createdBy}</p>
                          <p className="text-[9px] text-slate-400">{formattedTime} น.</p>
                        </div>
                      </div>

                      {/* Note message */}
                      {count.note && (
                        <div className="bg-slate-50 p-2.5 rounded-xl text-[10px] text-slate-600 flex items-start space-x-1 border border-slate-100">
                          <FileText size={12} className="text-slate-400 shrink-0 mt-0.5" />
                          <span>หมายเหตุ: {count.note}</span>
                        </div>
                      )}

                      {/* Sync details (if synced) */}
                      {count.status === 'SYNCED' && count.storeName && (
                        <div className="bg-slate-50 p-2.5 rounded-xl text-[10px] text-slate-500 flex items-center space-x-1.5 border border-slate-100">
                          <History size={12} className="text-slate-400" />
                          <span>ซิงค์ไปที่สาขา <strong>{count.storeName}</strong> แล้วเมื่อ {count.syncedAt ? new Date(count.syncedAt).toLocaleTimeString('th-TH') : ''} น.</span>
                        </div>
                      )}

                      {/* Action buttons */}
                      {count.status === 'PENDING' && (
                        <div className="flex space-x-2 pt-1">
                          <button
                            onClick={() => handleApprove(count.id)}
                            disabled={isSyncing}
                            className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition duration-150 flex items-center justify-center space-x-1.5 shadow-xs"
                          >
                            {isSyncing ? (
                              <>
                                <RefreshCw size={13} className="animate-spin" />
                                <span>กำลังส่งเข้าระบบ Loyverse...</span>
                              </>
                            ) : (
                              <>
                                <Check size={14} />
                                <span>อนุมัติและอัปเดตสต็อก</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

      </main>
    </div>
  );
}
