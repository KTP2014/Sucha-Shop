'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Edit2, ShieldAlert, Check, RefreshCw, Ban, UserCheck, Trash2, ArrowLeft } from 'lucide-react';

interface StaffUser {
  id: string;
  name: string;
  pin: string;
  isActive: boolean;
  createdAt: string;
}

export default function StaffCrud() {
  const router = useRouter();
  
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Form State - Add new
  const [name, setName] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [adding, setAdding] = useState<boolean>(false);

  // Form State - Edit existing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editPin, setEditPin] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/owner/staff');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'ไม่สามารถโหลดข้อมูลพนักงานได้');
      }
      const data = await res.json();
      setStaffList(data.staffList || []);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pin) {
      setError('กรุณากรอกชื่อและรหัส PIN ให้ครบถ้วน');
      return;
    }

    if (pin.length !== 4 || isNaN(Number(pin))) {
      setError('รหัส PIN ต้องเป็นตัวเลข 4 หลักเท่านั้น');
      return;
    }

    setAdding(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/owner/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'ไม่สามารถสร้างบัญชีพนักงานได้');
      }

      setSuccess(`เพิ่มพนักงาน "${name}" เรียบร้อยแล้ว!`);
      setName('');
      setPin('');
      fetchStaff();

      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการสร้างบัญชีพนักงาน');
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editName || !editPin) {
      setError('กรุณากรอกชื่อและรหัส PIN');
      return;
    }

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/owner/staff', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingId,
          name: editName,
          pin: editPin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'ไม่สามารถอัปเดตข้อมูลพนักงานได้');
      }

      setSuccess('แก้ไขข้อมูลพนักงานเรียบร้อยแล้ว!');
      setEditingId(null);
      fetchStaff();

      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/owner/staff', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          isActive: !currentActive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'ไม่สามารถจำกัดสิทธิ์พนักงานได้');
      }

      setSuccess(currentActive ? 'ระงับสิทธิ์การใช้งานพนักงานเรียบร้อย!' : 'กู้คืนสิทธิ์การใช้งานพนักงานเรียบร้อย!');
      fetchStaff();
      
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดขณะแก้ไขสถานะบัญชี');
    }
  };

  const handleDeleteStaff = async (id: string, staffName: string) => {
    if (!confirm(`คุณต้องการลบพนักงาน "${staffName}" ออกจากระบบถาวรใช่หรือไม่?`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/owner/staff', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'ไม่สามารถลบบัญชีพนักงานได้');
      }

      setSuccess(`ลบพนักงาน "${staffName}" สำเร็จ!`);
      fetchStaff();
      
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการลบบัญชีพนักงาน');
    }
  };

  const startEdit = (staff: StaffUser) => {
    setEditingId(staff.id);
    setEditName(staff.name);
    setEditPin(staff.pin);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12">
      {/* Navbar Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => router.push('/owner')}
            className="flex items-center space-x-1.5 text-slate-300 hover:text-white text-xs bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            <ArrowLeft size={14} />
            <span>กลับหน้าหลัก</span>
          </button>
          <span className="font-bold text-sm">จัดการพนักงาน (Owner)</span>
          <button 
            onClick={fetchStaff}
            className="p-1.5 text-slate-400 hover:text-white"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Main Container - Optimized for mobile layout */}
      <main className="max-w-md mx-auto px-4 mt-6 space-y-6">
        
        {/* Status Alerts */}
        {success && (
          <div className="flex items-center space-x-2 text-green-700 bg-green-50 p-4 rounded-xl text-xs font-semibold border border-green-100">
            <Check className="shrink-0" size={16} />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 text-red-700 bg-red-50 p-4 rounded-xl text-xs border border-red-100">
            <ShieldAlert className="shrink-0" size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Add/Edit Form Card */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <UserPlus className="text-purple-600" size={18} />
            <h2 className="text-sm font-bold text-slate-800">
              {editingId ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานตรวจสต็อกคนใหม่'}
            </h2>
          </div>

          {editingId ? (
            /* Update Form */
            <form onSubmit={handleUpdateStaff} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">ชื่อพนักงาน</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="กรอกชื่อ-นามสกุล..."
                  required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">รหัส PIN 4 หลัก</label>
                <input
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={4}
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value)}
                  placeholder="กรอก PIN 4 หลัก..."
                  required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold rounded-xl font-bold transition"
                >
                  {updating ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          ) : (
            /* Create Form */
            <form onSubmit={handleAddStaff} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">ชื่อพนักงาน</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="กรอกชื่อ-นามสกุล..."
                  required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">รหัส PIN 4 หลัก</label>
                <input
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="กรอก PIN 4 หลัก..."
                  required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={adding}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition active:scale-95 disabled:active:scale-100"
              >
                {adding ? 'กำลังบันทึก...' : 'เพิ่มพนักงานเข้าระบบ'}
              </button>
            </form>
          )}
        </section>

        {/* Staff List Feed */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">พนักงานทั้งหมดในระบบ</h3>

          {loading ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 flex justify-center">
              <RefreshCw size={20} className="animate-spin text-slate-400" />
            </div>
          ) : staffList.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center text-slate-400 border border-slate-100 text-xs">
              ไม่มีข้อมูลบัญชีพนักงาน ลูกน้อง หน้าร้าน ในฐานข้อมูลขณะนี้
            </div>
          ) : (
            <div className="space-y-2">
              {staffList.map((staff) => (
                <div 
                  key={staff.id} 
                  className={`p-4 rounded-2xl border transition-all ${
                    staff.isActive 
                      ? 'bg-white border-slate-100' 
                      : 'bg-red-50/30 border-red-100 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-xs text-slate-800">{staff.name}</h4>
                      <p className="text-[10px] text-slate-500">รหัส PIN: <span className="font-bold font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{staff.pin}</span></p>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => startEdit(staff)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="แก้ไขข้อมูล"
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(staff.id, staff.isActive)}
                        className={`p-2 rounded-lg transition ${
                          staff.isActive 
                            ? 'text-amber-600 hover:bg-amber-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={staff.isActive ? 'แบนพนักงาน' : 'ปลดแบน'}
                      >
                        {staff.isActive ? <Ban size={13} /> : <UserCheck size={13} />}
                      </button>

                      <button
                        onClick={() => handleDeleteStaff(staff.id, staff.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="ลบพนักงาน"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
