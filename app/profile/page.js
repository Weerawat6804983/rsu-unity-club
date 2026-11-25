'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  User,
  Mail,
  IdCard,
  Building2,
  ShieldCheck,
  Lock,
  Save,
  CheckCircle2,
  Award,
  Users,
  LogIn,
} from 'lucide-react';

const RSU_FACULTIES = [
  'วิทยาลัยนวัตกรรมดิจิทัลเทคโนโลยี',
  'คณะบริหารธุรกิจ',
  'คณะนิเทศศาสตร์',
  'วิทยาลัยวิศวกรรมศาสตร์',
  'วิทยาลัยแพทยศาสตร์',
  'คณะทันตแพทยศาสตร์',
  'คณะเภสัชศาสตร์',
  'คณะพยาบาลศาสตร์',
  'คณะศิลปศาสตร์',
  'คณะนิติศาสตร์',
  'วิทยาลัยดนตรี',
  'วิทยาลัยการออกแบบ',
  'วิทยาลัยการท่องเที่ยว การบริการ และกีฬา',
  'กองพัฒนานักศึกษา (Division of Student Affairs)',
  'อื่นๆ (Other)',
];

const ROLE_META = {
  STUDENT: {
    badgeText: 'นักศึกษา (STUDENT)',
    badgeStyle: 'bg-sky-500/20 text-sky-200 border-sky-400/30',
    idLabel: 'รหัสนักศึกษา (Student ID)',
  },
  PRESIDENT: {
    badgeText: 'ประธานชมรม (PRESIDENT)',
    badgeStyle: 'bg-pink-500/25 text-pink-200 border-pink-400/40',
    idLabel: 'รหัสนักศึกษา (Student ID)',
  },
  ADVISOR: {
    badgeText: 'อาจารย์ที่ปรึกษา (ADVISOR)',
    badgeStyle: 'bg-indigo-500/25 text-indigo-200 border-indigo-400/40',
    idLabel: 'รหัสอาจารย์ / บุคลากร (Staff ID)',
  },
  ADMIN: {
    badgeText: 'ผู้ดูแลระบบ (ADMIN)',
    badgeStyle: 'bg-amber-500/25 text-amber-200 border-amber-400/40',
    idLabel: 'รหัสเจ้าหน้าที่ (Admin ID)',
  },
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [managedClubName, setManagedClubName] = useState(null);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const [meRes, clubsRes, usersRes] = await Promise.all([
          fetch('/api/auth/me', { cache: 'no-store' }),
          fetch('/api/clubs', { cache: 'no-store' }),
          fetch('/api/admin/users', { cache: 'no-store' }),
        ]);

        if (!meRes.ok) {
          setLoading(false);
          return;
        }

        const meData = await meRes.json();
        if (!meData.authenticated || !meData.user) {
          setProfile(null);
          setLoading(false);
          return;
        }

        let userObj = meData.user;
        let fetchedClubs = [];

        if (clubsRes.ok) {
          const clubsData = await clubsRes.json();
          if (clubsData.success) fetchedClubs = clubsData.clubs || [];
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          if (usersData.success) {
            const fresh = (usersData.users || []).find((u) => u.id === userObj.id);
            if (fresh) userObj = fresh;
          }
        }

        setProfile(userObj);

        if (userObj.role === 'ADMIN') {
          setManagedClubName(`ดูแลระบบส่วนกลาง (${fetchedClubs.length} ชมรม)`);
        } else if (userObj.managed_club_id) {
          const club = fetchedClubs.find(
            (c) => Number(c.id) === Number(userObj.managed_club_id)
          );
          setManagedClubName(club ? club.name : null);
        } else {
          setManagedClubName(null);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile) return;

    setFormError('');
    setSavedSuccess(false);

    if (passwords.newPassword || passwords.confirmPassword) {
      if (!passwords.currentPassword) {
        setFormError('กรุณากรอกรหัสผ่านปัจจุบันก่อนเปลี่ยนรหัสผ่านใหม่');
        return;
      }
      if (passwords.newPassword.length < 6) {
        setFormError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
        return;
      }
      if (passwords.newPassword !== passwords.confirmPassword) {
        setFormError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: profile.id,
          full_name: profile.full_name,
          faculty: profile.faculty,
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || 'บันทึกข้อมูลไม่สำเร็จ');
        setSaving(false);
        return;
      }

      setSavedSuccess(true);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch {
      setFormError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
        <Navbar />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-16 text-center text-sm text-slate-400">
          กำลังโหลดข้อมูลโปรไฟล์...
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
        <Navbar />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-16 text-center space-y-4">
          <p className="text-lg font-extrabold text-slate-800">
            กรุณาเข้าสู่ระบบเพื่อดูข้อมูลโปรไฟล์ของคุณ
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C81E6E] hover:bg-[#a6175a] text-white text-sm font-semibold"
          >
            <LogIn className="w-4 h-4" />
            ไปหน้าเข้าสู่ระบบ
          </Link>
        </main>
      </div>
    );
  }

  const roleInfo = ROLE_META[profile.role] || ROLE_META.STUDENT;
  const facultyOptions = Array.from(
    new Set([profile.faculty, ...RSU_FACULTIES].filter(Boolean))
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
        {/* ส่วนหัวโปรไฟล์พร้อมป้ายบอกยศ */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-[#2a0c1d] to-indigo-950 text-white p-6 sm:p-8 shadow-xl">
          <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#C81E6E]/35 blur-3xl" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-[#C81E6E] to-purple-600 flex items-center justify-center text-2xl sm:text-3xl font-extrabold shadow-lg border-2 border-white/20 shrink-0">
              {(profile.full_name || 'U').charAt(0)}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-xs font-bold ${roleInfo.badgeStyle}`}
                >
                  <Award className="w-3.5 h-3.5" />
                  {roleInfo.badgeText}
                </span>
                {managedClubName && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-slate-200">
                    <Users className="w-3.5 h-3.5 text-pink-400" />
                    {managedClubName}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
                {profile.full_name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                รหัสประจำตัว {profile.student_id} • {profile.faculty}
              </p>
            </div>
          </div>
        </section>

        {/* แจ้งเตือนเมื่อบันทึกสำเร็จ */}
        {savedSuccess && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold shadow-2xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว
          </div>
        )}

        {/* ฟอร์มแก้ไขข้อมูล */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* กล่องที่ 1: ข้อมูลพื้นฐาน */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-extrabold text-slate-900">ข้อมูลส่วนตัวและสิทธิ์การใช้งาน</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                รหัสประจำตัว, อีเมลมหาวิทยาลัย และบทบาท (Role) ถูกกำหนดโดยระบบ หากข้อมูลผิดพลาดกรุณาติดต่อผู้ดูแลระบบ
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* บทบาทในระบบ (Read-Only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#C81E6E]" />
                  บทบาท / ยศในระบบ (Role)
                </label>
                <input
                  type="text"
                  value={roleInfo.badgeText}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-sm font-bold cursor-not-allowed"
                />
              </div>

              {/* ชมรมที่สังกัด/ดูแล */}
              {managedClubName && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#C81E6E]" />
                    {profile.role === 'ADVISOR' ? 'ชมรมที่เป็นที่ปรึกษา' : 'ชมรมที่รับผิดชอบดูแล'}
                  </label>
                  <input
                    type="text"
                    value={managedClubName}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-sm font-medium cursor-not-allowed"
                  />
                </div>
              )}

              {/* รหัสนักศึกษา / รหัสอาจารย์ (Read-Only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <IdCard className="w-3.5 h-3.5 text-slate-400" />
                  {roleInfo.idLabel}
                </label>
                <input
                  type="text"
                  value={profile.student_id || ''}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-sm font-medium cursor-not-allowed"
                />
              </div>

              {/* อีเมล (Read-Only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  อีเมลมหาวิทยาลัย (RSU Email)
                </label>
                <input
                  type="email"
                  value={profile.email || ''}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-sm font-medium cursor-not-allowed"
                />
              </div>

              {/* ชื่อ-นามสกุล (แก้ไขได้) */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#C81E6E]" />
                  ชื่อ - นามสกุล / ตำแหน่งทางวิชาการ (Full Name)
                </label>
                <input
                  type="text"
                  required
                  value={profile.full_name || ''}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#C81E6E]/30 focus:border-[#C81E6E]"
                />
              </div>

              {/* คณะ / หน่วยงาน (แก้ไขได้) */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#C81E6E]" />
                  คณะ / วิทยาลัย / หน่วยงาน (Faculty / Department)
                </label>
                <select
                  value={profile.faculty || ''}
                  onChange={(e) => setProfile({ ...profile, faculty: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#C81E6E]/30 focus:border-[#C81E6E]"
                >
                  {facultyOptions.map((fac) => (
                    <option key={fac} value={fac}>
                      {fac}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* กล่องที่ 2: เปลี่ยนรหัสผ่าน */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">เปลี่ยนรหัสผ่าน (Change Password)</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน
                </p>
              </div>
              <ShieldCheck className="w-6 h-6 text-slate-300" />
            </div>

            {formError && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3.5 py-2.5 rounded-xl">
                {formError}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  รหัสผ่านปัจจุบัน
                </label>
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C81E6E]/30 focus:border-[#C81E6E]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">รหัสผ่านใหม่</label>
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C81E6E]/30 focus:border-[#C81E6E]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ยืนยันรหัสผ่านใหม่</label>
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C81E6E]/30 focus:border-[#C81E6E]"
                />
              </div>
            </div>
          </div>

          {/* ปุ่มบันทึก */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#C81E6E] to-pink-600 hover:from-[#a6175a] hover:to-[#C81E6E] disabled:opacity-60 text-white text-sm font-bold shadow-lg shadow-pink-500/20 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}