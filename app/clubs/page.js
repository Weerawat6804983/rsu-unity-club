'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  Search,
  Users,
  Sparkles,
  UserPlus,
  CheckCircle2,
  GraduationCap,
  X,
  Clock,
  Building2,
  Trophy,
  Code2,
  Camera,
  Heart,
  Music,
  Puzzle,
  Phone,
  LogIn,
} from 'lucide-react';

const DEFAULT_CATEGORIES = [
  'ฝ่ายวิชาการและนวัตกรรม',
  'ฝ่ายศิลปวัฒนธรรมและดนตรี',
  'ฝ่ายกีฬาและนันทนาการ',
  'ฝ่ายบำเพ็ญประโยชน์และสิ่งแวดล้อม',
  'ฝ่ายสื่อสารมวลชนและเทคโนโลยี',
];

const DEFAULT_FACULTIES = [
  'ส่วนกลาง (ทุกคณะ)',
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
];

function getClubVisual(category) {
  switch (category) {
    case 'ฝ่ายวิชาการและนวัตกรรม':
      return {
        gradient: 'from-indigo-600 via-blue-600 to-cyan-500',
        icon: 'CODE',
      };
    case 'ฝ่ายศิลปวัฒนธรรมและดนตรี':
      return {
        gradient: 'from-fuchsia-600 via-pink-600 to-rose-500',
        icon: 'MUSIC',
      };
    case 'ฝ่ายกีฬาและนันทนาการ':
      return {
        gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
        icon: 'TROPHY',
      };
    case 'ฝ่ายบำเพ็ญประโยชน์และสิ่งแวดล้อม':
      return {
        gradient: 'from-green-600 via-emerald-600 to-teal-500',
        icon: 'HEART',
      };
    case 'ฝ่ายสื่อสารมวลชนและเทคโนโลยี':
      return {
        gradient: 'from-purple-600 via-violet-600 to-indigo-600',
        icon: 'CAMERA',
      };
    default:
      return {
        gradient: 'from-[#C81E6E] via-pink-600 to-purple-700',
        icon: 'PUZZLE',
      };
  }
}

function ClubIcon({ type }) {
  const iconClass = 'w-6 h-6 text-white';
  switch (type) {
    case 'TROPHY':
      return <Trophy className={iconClass} />;
    case 'CODE':
      return <Code2 className={iconClass} />;
    case 'CAMERA':
      return <Camera className={iconClass} />;
    case 'HEART':
      return <Heart className={iconClass} />;
    case 'MUSIC':
      return <Music className={iconClass} />;
    default:
      return <Puzzle className={iconClass} />;
  }
}

export default function ClubsDirectoryPage() {
  const [clubs, setClubs] = useState([]);
  const [realUser, setRealUser] = useState(null);
  const [userApplications, setUserApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedFaculty, setSelectedFaculty] = useState('ทั้งหมด (ทุกคณะ)');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด (All)');
  const [searchQuery, setSearchQuery] = useState('');

  // State สำหรับป๊อปอัป (Modal) สมัครเข้าชมรม
  const [applyingClub, setApplyingClub] = useState(null);
  const [contact, setContact] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [clubsRes, meRes] = await Promise.all([
        fetch('/api/clubs', { cache: 'no-store' }),
        fetch('/api/auth/me', { cache: 'no-store' }),
      ]);

      if (clubsRes.ok) {
        const clubsData = await clubsRes.json();
        if (clubsData.success) {
          setClubs(clubsData.clubs || []);
        }
      }

      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.authenticated && meData.user) {
          setRealUser(meData.user);
          setContact(meData.user.email || '');

          const appsRes = await fetch(`/api/applications?user_id=${meData.user.id}`, {
            cache: 'no-store',
          });
          if (appsRes.ok) {
            const appsData = await appsRes.json();
            if (appsData.success) {
              setUserApplications(appsData.applications || []);
            }
          }
        } else {
          setRealUser(null);
          setUserApplications([]);
        }
      }
    } catch (error) {
      console.error('Failed to load clubs data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // รวมรายการหมวดหมู่และคณะจากค่ามาตรฐาน + ข้อมูลจริงในฐานข้อมูล
  const categories = [
    'ทั้งหมด (All)',
    ...Array.from(
      new Set([...DEFAULT_CATEGORIES, ...clubs.map((c) => c.category).filter(Boolean)])
    ),
  ];

  const faculties = [
    'ทั้งหมด (ทุกคณะ)',
    ...Array.from(
      new Set([...DEFAULT_FACULTIES, ...clubs.map((c) => c.faculty).filter(Boolean)])
    ),
  ];

  const filteredClubs = clubs.filter((club) => {
    const matchFaculty =
      selectedFaculty === 'ทั้งหมด (ทุกคณะ)' || club.faculty === selectedFaculty;
    const matchCategory =
      selectedCategory === 'ทั้งหมด (All)' || club.category === selectedCategory;
    const matchSearch =
      (club.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (club.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (club.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchFaculty && matchCategory && matchSearch;
  });

  const openApplyModal = (club) => {
    setApplyingClub(club);
    setContact(realUser?.email || '');
    setReason('');
  };

  const handleConfirmApply = async (e) => {
    e.preventDefault();
    if (!applyingClub || !realUser) return;

    if (!contact.trim()) {
      showToast('กรุณากรอกช่องทางติดต่อ (LINE ID, เบอร์โทร หรืออีเมล)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: realUser.id,
          club_id: applyingClub.id,
          contact: contact.trim(),
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'ส่งใบสมัครไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        setSubmitting(false);
        return;
      }

      await fetchData();
      showToast(data.message);
      setApplyingClub(null);
      setReason('');
    } catch {
      showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Navbar />

      {/* แถบแจ้งเตือนเมื่อกดสมัครสำเร็จ */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 text-white px-4 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs sm:text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* ส่วนหัวและตัวกรอง */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-[#2a0c1d] to-indigo-950 text-white p-6 sm:p-9 shadow-xl space-y-6">
          <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#C81E6E]/30 blur-3xl" />

          <div className="relative z-10">
            <span className="text-xs font-bold tracking-wider text-pink-300 uppercase">
              RSU Clubs & Faculties Directory
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mt-1">
              รวมชมรมและสังกัดคณะทั้งหมด
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5">
              เลือกกรองชมรมตามคณะ/วิทยาลัย หรือหมวดหมู่ความสนใจเพื่อยื่นใบสมัครออนไลน์
            </p>
          </div>

          {/* แถบค้นหา + ตัวเลือกคณะ */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อชมรม หรือคำอธิบาย..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-4 focus:ring-pink-500/30 shadow-md"
              />
            </div>

            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <select
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-pink-500/30 shadow-md"
              >
                {faculties.map((fac) => (
                  <option key={fac} value={fac}>
                    สังกัด: {fac}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* แถบปุ่มเลือกหมวดหมู่ */}
          <div className="relative z-10 flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap pt-2 border-t border-white/10">
            {categories.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-[#C81E6E] to-pink-500 text-white shadow-md shadow-pink-500/30'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20 border border-white/10'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </section>

        {/* จำนวนผลลัพธ์ */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600">
          <span>
            พบชมรมที่ตรงกับเงื่อนไขทั้งหมด{' '}
            <strong className="text-[#C81E6E]">{filteredClubs.length}</strong> ชมรม
          </span>
          {(selectedFaculty !== 'ทั้งหมด (ทุกคณะ)' ||
            selectedCategory !== 'ทั้งหมด (All)' ||
            searchQuery) && (
            <button
              onClick={() => {
                setSelectedFaculty('ทั้งหมด (ทุกคณะ)');
                setSelectedCategory('ทั้งหมด (All)');
                setSearchQuery('');
              }}
              className="text-[#C81E6E] font-semibold hover:underline cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>

        {/* การ์ดแสดงชมรม */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-sm text-slate-400 shadow-sm">
            กำลังโหลดรายชื่อชมรมจากฐานข้อมูล...
          </div>
        ) : filteredClubs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2 shadow-sm">
            <p className="text-base font-bold text-slate-700">
              {clubs.length === 0 ? 'ยังไม่มีชมรมในระบบ' : 'ไม่พบชมรมที่ค้นหา'}
            </p>
            <p className="text-xs text-slate-500">
              {clubs.length === 0
                ? 'สามารถจัดตั้งชมรมใหม่ได้จากหน้า Admin Panel'
                : 'ลองเปลี่ยนตัวกรองคณะหรือหมวดหมู่ใหม่อีกครั้ง'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map((club) => {
              const visual = getClubVisual(club.category);
              const existingApp = userApplications.find(
                (app) =>
                  Number(app.club_id) === Number(club.id) &&
                  (app.status === 'APPROVED' || app.status === 'PENDING')
              );
              const isApproved = existingApp?.status === 'APPROVED';
              const isPending = existingApp?.status === 'PENDING';

              return (
                <div
                  key={club.id}
                  className="group bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* แถบแบนเนอร์ไล่สีด้านบนของการ์ด */}
                    <div
                      className={`h-24 bg-gradient-to-r ${visual.gradient} p-4 flex items-start justify-between`}
                    >
                      <span className="px-2.5 py-1 rounded-lg bg-black/25 backdrop-blur-md text-white text-[11px] font-semibold">
                        {club.faculty || 'ส่วนกลาง (ทุกคณะ)'}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs ${
                          club.approval_mode === 'AUTO'
                            ? 'bg-emerald-400 text-slate-950'
                            : 'bg-white/95 text-slate-800'
                        }`}
                      >
                        {club.approval_mode === 'AUTO' ? 'อนุมัติทันที' : 'รอประธานอนุมัติ'}
                      </span>
                    </div>

                    {/* เนื้อหาการ์ด + กล่องไอคอนลอยทับรอยต่อ */}
                    <div className="px-6 pb-5 pt-0 space-y-3">
                      <div className="-mt-7 mb-2 flex items-end justify-between">
                        <div
                          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${visual.gradient} border-4 border-white shadow-md flex items-center justify-center`}
                        >
                          <ClubIcon type={visual.icon} />
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#C81E6E] bg-pink-50 px-2.5 py-1 rounded-full">
                          <Sparkles className="w-3.5 h-3.5" />
                          {club.highlight_badge || 'เปิดรับสมัคร'}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-[#C81E6E] transition">
                          {club.name}
                        </h3>
                        <p className="text-xs font-medium text-slate-500">{club.category}</p>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {club.description ||
                          'ชมรมกิจกรรมนักศึกษา มหาวิทยาลัยรังสิต เปิดรับสมัครสมาชิกใหม่'}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-3 border-t border-slate-100 space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <Users className="w-4 h-4 text-[#C81E6E]" />
                        สมาชิก {Number(club.member_count || 0)} คน
                      </span>
                      <span className="text-slate-400">ปีการศึกษา 2026</span>
                    </div>

                    {isApproved ? (
                      <button
                        disabled
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        เป็นสมาชิกชมรมแล้ว
                      </button>
                    ) : isPending ? (
                      <button
                        disabled
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <Clock className="w-4 h-4" />
                        ส่งใบสมัครแล้ว (รออนุมัติ)
                      </button>
                    ) : (
                      <button
                        onClick={() => openApplyModal(club)}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#C81E6E] to-pink-600 hover:from-[#a6175a] hover:to-[#C81E6E] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-pink-500/15 transition cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        สมัครเข้าชมรม (Apply)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL ป๊อปอัปฟอร์มสมัครเข้าชมรม */}
      {applyingClub && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            {/* แถบสีด้านบน Modal */}
            <div
              className={`bg-gradient-to-r ${
                getClubVisual(applyingClub.category).gradient
              } p-5 text-white flex items-start justify-between gap-3`}
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                  Club Application
                </span>
                <h2 className="text-xl font-extrabold mt-0.5">
                  สมัครเข้า {applyingClub.name}
                </h2>
                <p className="text-xs text-white/90">{applyingClub.category}</p>
              </div>
              <button
                onClick={() => setApplyingClub(null)}
                className="p-1.5 rounded-xl bg-black/20 text-white hover:bg-black/30 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!realUser ? (
              <div className="p-6 text-center space-y-4">
                <p className="text-sm font-bold text-slate-800">
                  กรุณาเข้าสู่ระบบก่อนสมัครเข้าชมรม
                </p>
                <p className="text-xs text-slate-500">
                  ระบบจะดึงชื่อ รหัสนักศึกษา และคณะของคุณจากบัญชีที่ล็อกอินโดยอัตโนมัติ
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setApplyingClub(null)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    ปิดหน้าต่าง
                  </button>
                  <Link
                    href="/login"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#C81E6E] hover:bg-[#a6175a] text-white text-sm font-semibold flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <LogIn className="w-4 h-4" />
                    ไปหน้าเข้าสู่ระบบ
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {/* แสดงข้อมูลนักศึกษาที่ระบบดึงให้อัตโนมัติ */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-1 text-xs">
                  <p className="font-bold text-slate-700 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#C81E6E]" />
                    ข้อมูลผู้สมัคร (ดึงจากบัญชีของคุณอัตโนมัติ)
                  </p>
                  <p className="text-slate-600">
                    ชื่อ-นามสกุล: <strong>{realUser.full_name}</strong> (รหัส {realUser.student_id})
                  </p>
                  <p className="text-slate-600">คณะ: {realUser.faculty}</p>
                </div>

                {/* แจ้งรูปแบบการอนุมัติของชมรมนี้ */}
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    applyingClub.approval_mode === 'AUTO'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {applyingClub.approval_mode === 'AUTO' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>
                        ชมรมนี้เปิดรับแบบ <strong>อนุมัติทันที (Auto-Approve)</strong>
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>
                        ชมรมนี้ต้องรอ <strong>ประธานชมรมตรวจสอบและอนุมัติ (Manual)</strong>
                      </span>
                    </>
                  )}
                </div>

                <form onSubmit={handleConfirmApply} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      ช่องทางติดต่อ (LINE ID / เบอร์โทร / อีเมล) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder="เช่น LINE: mylineid หรือ 089-xxx-xxxx"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C81E6E]/30 focus:border-[#C81E6E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      เหตุผลที่สนใจเข้าร่วม / ความถนัด{' '}
                      <span className="text-slate-400 font-normal">(ไม่บังคับ)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="เช่น สนใจอยากฝึกสกิลและร่วมทำกิจกรรมกับเพื่อนๆ ในชมรม..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C81E6E]/30 focus:border-[#C81E6E]"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setApplyingClub(null)}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#C81E6E] to-pink-600 hover:from-[#a6175a] hover:to-[#C81E6E] disabled:opacity-60 text-white text-sm font-semibold shadow-md shadow-pink-500/20 transition cursor-pointer"
                    >
                      {submitting ? 'กำลังส่งใบสมัคร...' : 'ยืนยันการสมัคร'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}