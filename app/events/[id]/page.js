'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Award,
  ExternalLink,
  FileText,
  AlertCircle,
} from 'lucide-react';

const DEFAULT_EVENT_BANNER =
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80';

export default function EventDetailPage() {
  const params = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEventDetail() {
      try {
        const res = await fetch('/api/events', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.events)) {
            const found = data.events.find(
              (item) => String(item.id) === String(params.id)
            );
            setEvent(found || null);
          }
        }
      } catch (error) {
        console.error('Failed to fetch event detail:', error);
      } finally {
        setLoading(false);
      }
    }

    if (params?.id) {
      fetchEventDetail();
    }
  }, [params?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
        <Navbar />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-16 text-center text-sm text-slate-400">
          กำลังโหลดรายละเอียดกิจกรรม...
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
        <Navbar />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-16 text-center space-y-4">
          <p className="text-xl font-extrabold text-slate-800">ไม่พบข้อมูลกิจกรรมนี้</p>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C81E6E] text-white text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปหน้ารวมกิจกรรม
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-[#C81E6E] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับไปหน้ารวมกิจกรรม
        </Link>

        <article className="bg-white rounded-[2rem] border border-slate-200/90 overflow-hidden shadow-sm">
          {/* รูปปกกิจกรรม */}
          <div className="relative h-60 sm:h-80 bg-slate-200">
            <img
              src={event.image_url || DEFAULT_EVENT_BANNER}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/20 to-transparent" />

            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <span className="px-3.5 py-1 rounded-full bg-[#C81E6E] text-white text-xs font-bold shadow">
                กิจกรรมชมรม
              </span>
              {event.hours && (
                <span className="px-3.5 py-1 rounded-full bg-white/95 text-indigo-700 text-xs font-bold shadow flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  {event.hours}
                </span>
              )}
            </div>

            <div className="absolute bottom-5 left-5 right-5 text-white">
              <p className="text-xs sm:text-sm font-bold text-pink-300">
                {event.club_name || 'ชมรมนักศึกษา มหาวิทยาลัยรังสิต'}
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-0.5 leading-snug">
                {event.title}
              </h1>
            </div>
          </div>

          {/* เนื้อหารายละเอียด */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* กล่องข้อมูลวัน เวลา สถานที่ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-[#C81E6E] shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-400 text-xs">วันที่จัดกิจกรรม</p>
                  <p className="font-bold text-slate-800">{event.event_date}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#C81E6E] shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-400 text-xs">เวลา</p>
                  <p className="font-bold text-slate-800">{event.event_time || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C81E6E] shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-400 text-xs">สถานที่</p>
                  <p className="font-bold text-slate-800">{event.location}</p>
                </div>
              </div>
            </div>

            {/* คำอธิบายกิจกรรม */}
            <div className="space-y-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                รายละเอียดกิจกรรม
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
                {event.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
              </p>
            </div>

            {/* กล่องลิงก์ลงทะเบียนที่ประธานชมรมแนบไว้ */}
            <div className="pt-5 border-t border-slate-100">
              {event.registration_url ? (
                <div className="rounded-2xl bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 border border-pink-200/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#C81E6E] uppercase flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      แบบฟอร์มลงทะเบียนเข้าร่วม (แนบโดยประธานชมรม)
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 break-all">
                      ลิงก์รับสมัคร:{' '}
                      <span className="font-medium text-slate-800">{event.registration_url}</span>
                    </p>
                  </div>

                  <a
                    href={event.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#C81E6E] to-pink-600 hover:from-[#a6175a] hover:to-[#C81E6E] text-white text-sm font-bold shadow-md shadow-pink-500/20 transition"
                  >
                    เปิดฟอร์มลงทะเบียน
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3 text-xs sm:text-sm text-amber-800">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>
                    กิจกรรมนี้ยังไม่มีลิงก์แบบฟอร์มลงทะเบียน (รอประธานชมรมเพิ่มลิงก์ Form ในระบบ)
                  </span>
                </div>
              )}
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}