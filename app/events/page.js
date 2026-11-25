'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  Search,
  Calendar,
  Clock,
  MapPin,
  ArrowUpRight,
  Award,
  Sparkles,
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

export default function EventsDirectoryPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด (All)');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setEvents(data.events || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const categories = [
    'ทั้งหมด (All)',
    ...Array.from(
      new Set([...DEFAULT_CATEGORIES, ...events.map((e) => e.club_category).filter(Boolean)])
    ),
  ];

  const filteredEvents = events.filter((event) => {
    const notExpired = !isEventExpired(event.event_date, event.event_time);
    const matchCategory =
      selectedCategory === 'ทั้งหมด (All)' || event.club_category === selectedCategory;
    const matchSearch =
      (event.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.club_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.location || '').toLowerCase().includes(searchQuery.toLowerCase());

    return notExpired && matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* ส่วนหัวหน้ากิจกรรม */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-[#2a0c1d] to-indigo-950 text-white p-6 sm:p-10 shadow-xl">
          <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#C81E6E]/35 blur-3xl" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-pink-200">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              RSU CAMPUS EVENTS • ปฏิทินกิจกรรมนักศึกษา
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              กิจกรรมทั้งหมดของชมรม (All Events)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              ค้นหากิจกรรม เวิร์กชอป และการแข่งขันจากชมรมทั้ง 5 ฝ่าย พร้อมสะสมชั่วโมงกิจกรรมรับรองจากมหาวิทยาลัย
            </p>

            {/* ช่องค้นหากิจกรรม */}
            <div className="relative max-w-xl pt-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 mt-0.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อกิจกรรม, ชื่อชมรม หรือสถานที่จัด..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-4 focus:ring-pink-500/30 shadow-lg"
              />
            </div>

            {/* ปุ่มกรองตามฝ่าย */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap pt-2">
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
          </div>
        </section>

        {/* แถบสรุปจำนวนที่พบ */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
            รายการกิจกรรมที่เปิดรับ ({filteredEvents.length})
          </h2>
          <span className="text-xs text-slate-500">คลิก “ดูเพิ่มเติม” เพื่ออ่านรายละเอียดและลิงก์สมัคร</span>
        </div>

        {/* รายการการ์ดกิจกรรม */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-sm text-slate-400 shadow-sm">
            กำลังโหลดรายการกิจกรรมจากฐานข้อมูล...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2 shadow-sm">
            <p className="text-base font-bold text-slate-800">
              {events.length === 0 ? 'ยังไม่มีกิจกรรมที่ประกาศในระบบ' : 'ไม่พบกิจกรรมที่ตรงกับการค้นหา'}
            </p>
            <p className="text-xs text-slate-500">
              {events.length === 0
                ? 'ประธานชมรมสามารถสร้างประกาศกิจกรรมใหม่ได้ในหน้า President Workspace'
                : 'ลองเปลี่ยนคำค้นหา หรือเลือกดูในหมวด “ทั้งหมด (All)”'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <article
                key={event.id}
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
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">
                        <Award className="w-3.5 h-3.5" />
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
        )}
      </main>
    </div>
  );
}