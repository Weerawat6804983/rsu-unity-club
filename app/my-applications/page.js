'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  ArrowRight,
  UserCheck,
  Calendar,
  LogIn,
} from 'lucide-react';

export default function MyApplicationsPage() {
  const [realUser, setRealUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchMyApplications = useCallback(async () => {
    try {
      const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!meRes.ok) {
        setLoading(false);
        return;
      }

      const meData = await meRes.json();
      if (!meData.authenticated || !meData.user) {
        setRealUser(null);
        setApplications([]);
        setLoading(false);
        return;
      }

      setRealUser(meData.user);

      const appsRes = await fetch(`/api/applications?user_id=${meData.user.id}`, {
        cache: 'no-store',
      });
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        if (appsData.success) {
          setApplications(appsData.applications || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user applications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyApplications();
  }, [fetchMyApplications]);

  const handleCancel = async (id, clubName) => {
    if (!confirm(`ต้องการยกเลิกใบสมัครของ "${clubName}" ใช่หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/applications?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchMyApplications();
        showToast(`ยกเลิกใบสมัคร "${clubName}" เรียบร้อยแล้ว`);
      } else {
        showToast(data.message || 'ยกเลิกใบสมัครไม่สำเร็จ');
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const formatThaiDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'APPROVED':
        return {
          accentColor: 'border-l-emerald-500',
          defaultNote: 'ยินดีต้อนรับเข้าสู่ชมรม! คุณได้รับการอนุมัติเป็นสมาชิกชมรมเรียบร้อยแล้ว',
        };
      case 'REJECTED':
        return {
          accentColor: 'border-l-red-500',
          defaultNote: 'คำขอสมัครไม่ผ่านการคัดเลือกในรอบนี้ สามารถเลือกสมัครชมรมอื่นเพิ่มเติมได้',
        };
      default:
        return {
          accentColor: 'border-l-amber-500',
          defaultNote: 'อยู่ระหว่างรอประธานชมรมตรวจสอบและอนุมัติใบสมัคร',
        };
    }
  };

  const approvedCount = applications.filter((a) => a.status === 'APPROVED').length;
  const pendingCount = applications.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Navbar />

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs sm:text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* ส่วนหัวโทนสีเข้ม-ชมพู */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-[#2a0c1d] to-indigo-950 text-white p-6 sm:p-9 shadow-xl">
          <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#C81E6E]/30 blur-3xl" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-bold tracking-wider text-pink-300 uppercase flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                Student Membership Status
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold">
                การสมัครเข้าชมรมของฉัน
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                ติดตามผลการอนุมัติและรายชื่อชมรมที่คุณเป็นสมาชิกอยู่
              </p>
            </div>

            <Link
              href="/clubs"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C81E6E] to-pink-500 hover:from-[#a6175a] hover:to-[#C81E6E] text-white text-xs sm:text-sm font-semibold shadow-lg shadow-pink-500/25 transition"
            >
              ค้นหาชมรมเพิ่มเติม
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* แถบสรุปสถานะย่อ */}
          <div className="relative z-10 flex flex-wrap gap-3 mt-6 pt-5 border-t border-white/10 text-xs sm:text-sm">
            <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/10">
              เป็นสมาชิกแล้ว: <strong className="text-emerald-300">{approvedCount} ชมรม</strong>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/10">
              รอการอนุมัติ: <strong className="text-amber-300">{pendingCount} รายการ</strong>
            </div>
          </div>
        </section>

        {/* รายการใบสมัคร */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-sm text-slate-400 shadow-sm">
            กำลังโหลดประวัติการสมัครของคุณ...
          </div>
        ) : !realUser ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
            <p className="text-base font-bold text-slate-800">
              กรุณาเข้าสู่ระบบเพื่อดูประวัติการสมัครชมรมของคุณ
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C81E6E] hover:bg-[#a6175a] text-white text-xs sm:text-sm font-semibold"
            >
              <LogIn className="w-4 h-4" />
              ไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
            <p className="text-base font-bold text-slate-700">ยังไม่มีประวัติการสมัครชมรม</p>
            <p className="text-xs text-slate-500">
              เลือกชมรมที่สนใจในทำเนียบชมรมเพื่อยื่นใบสมัครออนไลน์ได้เลย
            </p>
            <Link
              href="/clubs"
              className="inline-block px-5 py-2.5 rounded-xl bg-[#C81E6E] text-white text-xs sm:text-sm font-semibold"
            >
              ไปที่ทำเนียบชมรม
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const style = getStatusStyle(app.status);

              return (
                <div
                  key={app.id}
                  className={`bg-white rounded-2xl border border-slate-200/90 border-l-4 ${style.accentColor} p-5 sm:p-6 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-[#C81E6E] bg-pink-50 px-2.5 py-0.5 rounded-md">
                        {app.club_faculty || 'ส่วนกลาง (ทุกคณะ)'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        สมัครเมื่อ: {formatThaiDate(app.applied_at)}
                      </span>
                    </div>

                    <h2 className="text-lg font-extrabold text-slate-900">
                      {app.club_name}{' '}
                      {app.club_category && (
                        <span className="text-xs font-medium text-slate-500">
                          ({app.club_category})
                        </span>
                      )}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-600">{style.defaultNote}</p>

                    {app.reason && (
                      <p className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 inline-block">
                        เหตุผลที่ระบุ: “{app.reason}”
                      </p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {app.status === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        อนุมัติแล้ว (Approved)
                      </span>
                    )}

                    {app.status === 'PENDING' && (
                      <>
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                          <Clock className="w-4 h-4" />
                          รออนุมัติ (Pending)
                        </span>
                        <button
                          onClick={() => handleCancel(app.id, app.club_name)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          ยกเลิกใบสมัคร
                        </button>
                      </>
                    )}

                    {app.status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold">
                        <XCircle className="w-4 h-4" />
                        ไม่ผ่านการคัดเลือก
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}