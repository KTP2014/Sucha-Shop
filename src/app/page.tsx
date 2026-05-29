'use client';

import { useState } from 'react';
import { ShieldAlert, User, KeyRound, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [role, setRole] = useState<'staff' | 'owner' | null>(null);
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleNumberClick = (num: number) => {
    if (pin.length < 4) {
      setError('');
      setPin((prev) => prev + num);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleLogin = async () => {
    if (pin.length !== 4) {
      setError('กรุณากรอกรหัส PIN ให้ครบ 4 หลัก');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }

      // Successful login! Save display data to localStorage
      localStorage.setItem('userRole', role === 'staff' ? 'staff' : 'owner');
      localStorage.setItem('userName', data.user.name);

      // Force full window reload to send newly set HttpOnly cookies to Server Components instantly!
      if (role === 'staff') {
        window.location.href = '/staff';
      } else {
        window.location.href = '/owner';
      }
    } catch (err: any) {
      setError(err.message || 'รหัส PIN ไม่ถูกต้องสำหรับตำแหน่งที่เลือก');
      setPin('');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4 py-8 text-slate-800">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">ระบบนับสต็อกร้านเสื้อผ้า</h1>
          <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest">Clothing Inventory Linker</p>
        </div>

        {/* Step 1: Select Role */}
        {!role ? (
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-center text-slate-700">กรุณาเลือกตำแหน่งการใช้งาน</h2>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => setRole('staff')}
                className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl transition duration-200 text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">ลูกน้อง (Staff)</h3>
                    <p className="text-slate-500 text-xs mt-0.5">ใช้ตรวจนับสต็อกหน้าร้าน</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-400" />
              </button>

              <button
                onClick={() => setRole('owner')}
                className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl transition duration-200 text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">เจ้าของร้าน (Owner)</h3>
                    <p className="text-slate-500 text-xs mt-0.5">ตรวจสอบและยืนยันการอัปเดตสต็อก</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-400" />
              </button>
            </div>
            
            <div className="text-center py-2">
              <p className="text-xs text-slate-400">
                PIN ในฐานข้อมูล: Staff = 1234 | Owner = 9999
              </p>
            </div>
          </div>
        ) : (
          /* Step 2: PIN Input Code */
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => { setRole(null); handleClear(); }}
                className="text-xs text-blue-600 hover:underline"
              >
                &larr; เปลี่ยนตำแหน่ง
              </button>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-600 capitalize">
                ตำแหน่ง: {role === 'staff' ? 'ลูกน้อง' : 'เจ้าของร้าน'}
              </span>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-lg font-bold text-slate-800">กรุณากรอกรหัส PIN</h2>
              <p className="text-slate-500 text-xs">ระบุ PIN 4 หลักเพื่อเข้าสู่ระบบ</p>
            </div>

            {/* PIN Dots display */}
            <div className="flex justify-center space-x-4 py-2">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border transition-all duration-150 ${
                    pin.length > index
                      ? 'bg-slate-900 border-slate-900 scale-110'
                      : 'border-slate-300 bg-slate-50'
                  }`}
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-xl text-xs justify-center text-center">
                <ShieldAlert size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* PIN keypad grid */}
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumberClick(num)}
                  disabled={loading}
                  className="w-full aspect-square flex items-center justify-center text-lg font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 active:scale-95 rounded-xl transition duration-100"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className="w-full aspect-square flex items-center justify-center text-xs font-medium text-slate-500 hover:text-slate-800 rounded-xl"
              >
                ล้าง
              </button>
              <button
                type="button"
                onClick={() => handleNumberClick(0)}
                disabled={loading}
                className="w-full aspect-square flex items-center justify-center text-lg font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 active:scale-95 rounded-xl transition duration-100"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                disabled={loading}
                className="w-full aspect-square flex items-center justify-center text-xs font-medium text-slate-500 hover:text-slate-800 rounded-xl"
              >
                ลบ
              </button>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading || pin.length !== 4}
              className="w-full mt-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition duration-200 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center space-x-2 text-sm"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>กำลังตรวจสอบ...</span>
                </span>
              ) : (
                <span>ตกลง</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
