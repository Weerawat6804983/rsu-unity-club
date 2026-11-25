'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  Search,
  Calendar,
  Clock,
  MapPin,
  Users,
  Sparkles,
  UserPlus,
  Award,
  ArrowUpRight,
  Flame,
  Trophy,
  Code2,
  Camera,
  Heart,
  Music,
  Puzzle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const DEFAULT_EVENT_BANNER =
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80';

const DEFAULT_CATEGORIES = [
  'ฝ่ายวิชาการและนวัตกรรม',
  'ฝ่ายศิลปวัฒนธรรมและดนตรี',
  'ฝ่ายกีฬาและนันทนาการ',
  'ฝ่ายบำเพ็ญประโยชน์และสิ่งแวดล้อม',
  'ฝ่ายสื่อสารมวลชนและเทคโนโลยี',
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

// เช็กวันและเวลาหมดอายุของกิจกรรม (ตัดออกทันทีที่เลยเวลาเลิกงาน)
const isEventExpired = (dateString, timeString) => {
  if (!dateString) return false;
  try {
    let year, month, day;

    if (/^\d{4}-\d{2}-\d{2}/.test(dateString.trim())) {
      const [y, m, d] = dateString.trim().split('-').map(Number);
      year = y;
      month = m - 1;
      day = d;
    } else {
      const monthsMap = {
        'ม.ค.': 0, 'ก.พ.': 1, 'มี.ค.': 2, 'เม.ย.': 3, 'พ.ค.': 4, 'มิ.ย.': 5,
        'ก.ค.': 6, 'ส.ค.': 7, 'ก.ย.': 8, 'ต.ค.': 9, 'พ.ย.': 10, 'ธ.ค.': 11,
      };
      const parts = dateString.trim().split(/\s+/);
      if (parts.length < 3) return false;

      day = parseInt(parts[parts.length - 3], 10);
      month = monthsMap[parts[parts.length - 2]];
      year = parseInt(parts[parts.length - 1], 10);
    }

    if (isNaN(day) || month === undefined || isNaN(year)) return false;
    if (year > 2400) year -= 543;

    // ดึงเวลาสิ้นสุดจากช่วงเวลา (เช่น "16:30 - 19:00 น." -> ใช้ 19:00)
    let endHour = 23;
    let endMinute = 59;
    if (timeString) {
      const timeMatches = timeString.match(/\d{1,2}:\d{2}/g);
      if (timeMatches && timeMatches.length > 0) {
        const lastTime = timeMatches[timeMatches.length - 1];
        const [h, m] = lastTime.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          endHour = h;
          endMinute = m;
        }
      }
    }

    const eventEnd = new Date(year, month, day, endHour, endMinute, 0, 0);
    return eventEnd < new Date();
  } catch {
    return false;
  }
};

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

export default function HomePage() {
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด (All)');
  const [searchQuery, setSearchQuery] = useState('');

  // ดึงข้อมูลชมรมและกิจกรรมจริงจาก TiDB
  useEffect(() => {
    async function fetchHomeData() {
      try {
        const [clubsRes, eventsRes] = await Promise.all([
          fetch('/api/clubs', { cache: 'no-store' }),
          fetch('/api/events', { cache: 'no-store' }),
        ]);

        if (clubsRes.ok) {
          const clubsData = await clubsRes.json();
          if (clubsData.success) {
            setClubs(clubsData.clubs || []);
          }
        }

        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          if (eventsData.success) {
            setEvents(eventsData.events || []);
          }
        }
      } catch (error) {
        console.error('Failed to load home data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchHomeData();
  }, []);

  // กรองเฉพาะกิจกรรมที่ยังไม่หมดอายุ (เช็กทั้งวันที่และเวลาเลิกงาน)
  const activeEvents = events.filter((event) => !isEventExpired(event.event_date, event.event_time));

  // State สำหรับสไลด์กิจกรรมวนลูปอัตโนมัติ
  const [eventIndex, setEventIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);

  // ปรับจำนวนการ์ดที่โชว์พร้อมกันตามขนาดหน้าจอ (Phone 1 / iPad 2 / PC 3)
  useEffect(() => {
    const updateVisibleCount = () => {
      if (window.innerWidth < 768) {
        setVisibleCount(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };
    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

  // ตั้งเวลาเลื่อนวนลูปอัตโนมัติทุก 4 วินาที (หยุดเมื่อเอาเมาส์ชี้)
  useEffect(() => {
    if (isPaused || activeEvents.length <= 1) return;
    const timer = setInterval(() => {
      setEventIndex((prev) => (prev + 1) % activeEvents.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused, activeEvents.length]);

  const handlePrevEvent = () => {
    if (activeEvents.length === 0) return;
    setEventIndex((prev) => (prev - 1 + activeEvents.length) % activeEvents.length);
  };

  const handleNextEvent = () => {
    if (activeEvents.length === 0) return;
    setEventIndex((prev) => (prev + 1) % activeEvents.length);
  };

  const safeEventIndex = activeEvents.length > 0 ? eventIndex % activeEvents.length : 0;

  // ดึงรายการกิจกรรมตามลำดับวนลูปเฉพาะงานที่ยังไม่หมดวันและเวลา
  const visibleEvents =
    activeEvents.length === 0
      ? []
      : Array.from(
          { length: Math.min(visibleCount, activeEvents.length) },
          (_, offset) => activeEvents[(safeEventIndex + offset) % activeEvents.length]
        );

  const categories = [
    'ทั้งหมด (All)',
    ...Array.from(
      new Set([...DEFAULT_CATEGORIES, ...clubs.map((c) => c.category).filter(Boolean)])
    ),
  ];

  const filteredClubs = clubs.filter((club) => {
    const matchCategory =
      selectedCategory === 'ทั้งหมด (All)' || club.category === selectedCategory;
    const matchSearch =
      (club.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (club.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (club.faculty || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-14">
        {/* 1. HERO SECTION */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-[#2a0c1d] to-indigo-950 text-white p-6 sm:p-10 lg:p-12 shadow-xl">
          <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#C81E6E]/35 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-indigo-500/25 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-pink-200">
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                RANGSIT UNIVERSITY • ACADEMIC YEAR 2026
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                ค้นพบกิจกรรมและชมรม
                <span className="block bg-gradient-to-r from-pink-400 via-rose-300 to-amber-200 bg-clip-text text-transparent mt-1">
                  ที่ใช่สำหรับคุณ
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                Discover Clubs & Events at RSU — ศูนย์รวมคอมมูนิตี้นักศึกษา ค้นหาพื้นที่ปล่อยของ
                สร้างผลงาน และขยายมิตรภาพไร้ขีดจำกัดในรั้วมหาวิทยาลัยรังสิต
              </p>

              <div className="relative max-w-xl pt-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 mt-0.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อชมรม, ฝ่าย หรือคณะ..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-4 focus:ring-pink-500/30 shadow-lg"
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs sm:text-sm">
                  <Users className="w-4 h-4 text-pink-400" />
                  <span>
                    <strong>{clubs.length}</strong> ชมรม (5 ฝ่าย)
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs sm:text-sm">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  <span>
                    <strong>{activeEvents.length}</strong> กิจกรรมไฮไลต์
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs sm:text-sm">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>รับรองชั่วโมงกิจกรรม</span>
                </div>
              </div>
            </div>

            {/* การ์ดชมรมเด่นด้านขวา */}
            <div className="lg:col-span-5">
              <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                    <Flame className="w-4 h-4" />
                    Trending This Week
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-200 text-[11px] font-semibold">
                    เปิดรับสมัครอยู่
                  </span>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-xs text-slate-300">
                    กำลังโหลดข้อมูลชมรม...
                  </div>
                ) : clubs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-300">
                    ยังไม่มีชมรมในระบบ (เพิ่มชมรมได้ในหน้า Admin)
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...clubs]
                      .sort((a, b) => Number(b.member_count || 0) - Number(a.member_count || 0))
                      .slice(0, 3)
                      .map((club, index) => {
                      const visual = getClubVisual(club.category);
                      return (
                        <div
                          key={club.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${visual.gradient} flex items-center justify-center shrink-0 shadow-md`}
                            >
                              <ClubIcon type={visual.icon} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white truncate">{club.name}</p>
                              <p className="text-xs text-slate-300 truncate">
                                {club.category} • {Number(club.member_count || 0)} คน
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-pink-300 shrink-0">
                            #{index + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <Link
                  href="/clubs"
                  className="w-full py-2.5 px-4 rounded-xl bg-white text-slate-900 hover:bg-pink-50 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition"
                >
                  ดูทำเนียบชมรมทั้งหมด
                  <ArrowUpRight className="w-4 h-4 text-[#C81E6E]" />
                </Link>
              </div>
            </div>
          </div>

          {/* แถบปุ่มกรองหมวดหมู่ 5 ฝ่าย */}
          <div className="relative z-10 flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap pt-7 mt-7 border-t border-white/10">
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

        {/* 2. WEEKLY EVENTS ANNOUNCEMENT (สไลด์เลื่อนวนลูปอัตโนมัติ) */}
        <section
          id="events"
          className="space-y-6"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold tracking-wider text-[#C81E6E] uppercase">
                Weekly Highlights • Auto-Looping Feed
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                ข่าวสารกิจกรรมรายสัปดาห์ (Weekly Events)
              </h2>
            </div>

            {/* ปุ่มควบคุมสไลด์ ซ้าย - ขวา */}
            {activeEvents.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 hidden sm:inline mr-1">
                  {isPaused ? 'หยุดเลื่อนชั่วคราว' : 'เลื่อนวนอัตโนมัติ'}
                </span>
                <button
                  type="button"
                  onClick={handlePrevEvent}
                  aria-label="กิจกรรมก่อนหน้า"
                  className="w-10 h-10 rounded-full bg-white border border-slate-200 hover:border-[#C81E6E] hover:text-[#C81E6E] flex items-center justify-center shadow-2xs transition cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextEvent}
                  aria-label="กิจกรรมถัดไป"
                  className="w-10 h-10 rounded-full bg-white border border-slate-200 hover:border-[#C81E6E] hover:text-[#C81E6E] flex items-center justify-center shadow-2xs transition cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-sm text-slate-400 shadow-sm">
              กำลังโหลดข่าวสารกิจกรรม...
            </div>
          ) : activeEvents.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-1.5 shadow-sm">
              <p className="text-base font-bold text-slate-800">ยังไม่มีกิจกรรมที่เปิดรับในขณะนี้</p>
              <p className="text-xs text-slate-500">รอติดตามอัปเดตกิจกรรมใหม่จากชมรมต่างๆ เร็วๆ นี้</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleEvents.map((event) => (
                  <article
                    key={`${event.id}-${safeEventIndex}`}
                    className="group bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                  >
                    <div className="relative h-48 bg-slate-200 overflow-hidden">
                      <img
                        src={event.image_url || DEFAULT_EVENT_BANNER}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                      <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-[#C81E6E] text-white text-[11px] font-bold tracking-wide shadow-md">
                        {event.club_category || 'กิจกรรมชมรม'}
                      </span>
                    </div>

                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-[#C81E6E]">
                          {event.club_name || 'ชมรมนักศึกษา มหาวิทยาลัยรังสิต'}
                        </p>
                        <h3 className="font-bold text-base sm:text-lg text-slate-900 line-clamp-1 group-hover:text-[#C81E6E] transition">
                          {event.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        <div className="space-y-1.5 text-xs text-slate-500">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-[#C81E6E] shrink-0" />
                            <span className="font-medium text-slate-700">{event.event_date}</span>
                            <Clock className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
                            <span>{event.event_time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">
                            {event.hours}
                          </span>
                          <Link
                            href={`/events/${event.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-[#C81E6E] text-white text-xs sm:text-sm font-semibold transition"
                          >
                            ดูเพิ่มเติม
                            <ArrowUpRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* จุดบอกตำแหน่งสไลด์ด้านล่าง */}
              <div className="flex items-center justify-center gap-2 pt-1">
                {activeEvents.map((ev, idx) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setEventIndex(idx)}
                    aria-label={`ไปยังกิจกรรมที่ ${idx + 1}`}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      safeEventIndex === idx
                        ? 'w-7 bg-[#C81E6E]'
                        : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        {/* 3. CLUB DIRECTORY */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                Student Organizations • Open for Applications
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                ทำเนียบชมรมมหาวิทยาลัย (Club Directory)
              </h2>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600 shadow-2xs">
              กำลังแสดง: <strong className="text-[#C81E6E]">{filteredClubs.length}</strong> ชมรม
            </span>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-sm text-slate-400 shadow-sm">
              กำลังโหลดทำเนียบชมรม...
            </div>
          ) : filteredClubs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-1.5 shadow-sm">
              <p className="text-base font-bold text-slate-800">
                {clubs.length === 0 ? 'ยังไม่มีชมรมในฐานข้อมูล' : 'ไม่พบชมรมที่ค้นหา'}
              </p>
              <p className="text-xs text-slate-500">
                {clubs.length === 0
                  ? 'สามารถเพิ่มชมรมแรกได้ในหน้า Admin Panel'
                  : 'ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClubs.map((club) => {
                const visual = getClubVisual(club.category);
                return (
                  <div
                    key={club.id}
                    className="group bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
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

                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
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

                      <Link
                        href="/clubs"
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#C81E6E] to-pink-600 hover:from-[#a6175a] hover:to-[#C81E6E] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-pink-500/15 transition"
                      >
                        <UserPlus className="w-4 h-4" />
                        สมัครเข้าชมรม (Apply)
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <p className="font-extrabold text-slate-800 text-sm">
              Rangsit University <span className="text-[#C81E6E]">DIVISION OF STUDENT AFFAIRS</span>
            </p>
            <p className="mt-1">52/347 Muang-Ake, Phaholyothin Road, Lak-Hok, Pathumthani 12000 Thailand</p>
          </div>
          <div className="sm:text-right">
            <p className="font-bold text-slate-700">CLUB SUPPORT SERVICE</p>
            <p className="text-[#C81E6E] font-semibold mt-0.5">unity.support@rsu.ac.th</p>
          </div>
        </div>
      </footer>
    </div>
  );
}