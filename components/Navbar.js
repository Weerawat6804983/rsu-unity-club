'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Shield, Users, Eye, UserCheck, Sparkles, UserCircle, LogOut } from 'lucide-react';

const ROLE_LABELS = {
  STUDENT: 'นักศึกษา',
  PRESIDENT: 'ประธานชมรม',
  ADVISOR: 'อาจารย์',
  ADMIN: 'Admin',
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [realUser, setRealUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const currentRole = realUser?.role || 'GUEST';

  useEffect(() => {
    let isMounted = true;

    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.authenticated && data.user) {
            setRealUser(data.user);
            setLoadingAuth(false);
            return;
          }
        }

        if (isMounted) {
          setRealUser(null);
        }
      } catch {
        if (isMounted) setRealUser(null);
      } finally {
        if (isMounted) setLoadingAuth(false);
      }
    }

    fetchSession();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setRealUser(null);
    setMobileMenuOpen(false);
    router.refresh();
    router.push('/login');
  };

  const navLinkClass = (path) =>
    pathname === path
      ? 'px-3.5 py-1.5 rounded-full bg-pink-50 text-[#C81E6E] font-semibold transition'
      : 'px-3.5 py-1.5 rounded-full text-slate-600 hover:text-[#C81E6E] hover:bg-slate-50 transition';

  const mobileNavLinkClass = (path) =>
    pathname === path
      ? 'block px-3 py-2 rounded-xl text-sm font-semibold text-[#C81E6E] bg-pink-50/70'
      : 'block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50';

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* โลโก้ RSU Unity Club */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C81E6E] via-pink-600 to-purple-700 flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-pink-500/20 group-hover:scale-105 transition">
              RSU
            </div>
            <div>
              <span className="block font-extrabold text-slate-900 leading-tight tracking-tight">
                RSU Unity Club
              </span>
              <span className="block text-[10px] font-semibold tracking-widest text-[#C81E6E] uppercase">
                Rangsit University
              </span>
            </div>
          </Link>

          {/* เมนูหลัก (PC & iPad) */}
          <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
            <Link href="/" className={navLinkClass('/')}>
              หน้าแรก (Home)
            </Link>
            <Link href="/clubs" className={navLinkClass('/clubs')}>
              รวมชมรม & คณะ
            </Link>
            <Link href="/events" className={navLinkClass('/events')}>
              กิจกรรม
            </Link>
          </nav>

          {/* ปุ่มจัดการตามสิทธิ์ RBAC จริง (PC & iPad) */}
          <div className="hidden md:flex items-center gap-2">
            {!loadingAuth && currentRole === 'GUEST' && (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-[#C81E6E] transition"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#C81E6E] to-pink-600 hover:from-[#a6175a] hover:to-[#C81E6E] rounded-full shadow-md shadow-pink-500/20 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  สมัครสมาชิก
                </Link>
              </>
            )}

            {currentRole === 'STUDENT' && (
              <Link
                href="/my-applications"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#C81E6E] bg-pink-50 hover:bg-pink-100 border border-pink-200/80 rounded-full transition"
              >
                <UserCheck className="w-4 h-4" />
                การสมัครของฉัน
              </Link>
            )}

            {currentRole === 'PRESIDENT' && (
              <Link
                href="/president"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#C81E6E] to-purple-600 rounded-full shadow-md shadow-pink-500/20 transition"
              >
                <Users className="w-4 h-4" />
                จัดการชมรม (President)
              </Link>
            )}

            {currentRole === 'ADVISOR' && (
              <Link
                href="/advisor"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-full transition"
              >
                <Eye className="w-4 h-4" />
                ดูข้อมูลชมรม (Read-Only)
              </Link>
            )}

            {currentRole === 'ADMIN' && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-full shadow-sm transition"
              >
                <Shield className="w-4 h-4 text-pink-400" />
                จัดการระบบ (Admin)
              </Link>
            )}

            {realUser && (
              <>
                <Link
                  href="/profile"
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-full border transition ${
                    pathname === '/profile'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-[#C81E6E] hover:text-[#C81E6E]'
                  }`}
                >
                  <UserCircle className="w-4 h-4" />
                  <span>
                    {realUser.full_name} ({ROLE_LABELS[currentRole]})
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  title="ออกจากระบบ"
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-full transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>ออก</span>
                </button>
              </>
            )}
          </div>

          {/* ปุ่ม Hamburger สำหรับ Phone */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            aria-label="เปิดเมนู"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* เมนูเลื่อนลงสำหรับมือถือ (Phone Dropdown) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 pt-3 pb-5 space-y-2 shadow-xl">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/')}>
            หน้าแรก (Home)
          </Link>
          <Link href="/clubs" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/clubs')}>
            รวมชมรม & คณะ
          </Link>
          <Link href="/events" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/events')}>
            กิจกรรม
          </Link>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {currentRole === 'GUEST' && (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-semibold border border-slate-300 rounded-xl text-slate-700"
                >
                  เข้าสู่ระบบ (Login)
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-semibold bg-gradient-to-r from-[#C81E6E] to-pink-600 text-white rounded-xl"
                >
                  สมัครสมาชิก (Register)
                </Link>
              </>
            )}
            {currentRole === 'STUDENT' && (
              <Link
                href="/my-applications"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-semibold bg-pink-50 text-[#C81E6E] rounded-xl"
              >
                การสมัครของฉัน
              </Link>
            )}
            {currentRole === 'PRESIDENT' && (
              <Link
                href="/president"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-semibold bg-[#C81E6E] text-white rounded-xl"
              >
                จัดการชมรม (President Dashboard)
              </Link>
            )}
            {currentRole === 'ADVISOR' && (
              <Link
                href="/advisor"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-semibold bg-indigo-50 text-indigo-700 rounded-xl"
              >
                ดูข้อมูลชมรม (Advisor Read-Only)
              </Link>
            )}
            {currentRole === 'ADMIN' && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-semibold bg-slate-900 text-white rounded-xl"
              >
                จัดการระบบ (Admin Panel)
              </Link>
            )}
            {realUser && (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-semibold border border-slate-200 text-slate-700 rounded-xl"
                >
                  {realUser.full_name} ({ROLE_LABELS[currentRole]})
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-center py-2.5 text-sm font-semibold bg-red-50 text-red-600 border border-red-200 rounded-xl cursor-pointer"
                >
                  ออกจากระบบ (Logout)
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
} 