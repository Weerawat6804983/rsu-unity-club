'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import {
  Eye,
  Users,
  Clock,
  Calendar,
  MapPin,
  Award,
  Lock,
  Sparkles,
  FileText,
} from 'lucide-react';

const DEFAULT_EVENT_BANNER =
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80';

export default function AdvisorDashboardPage() {
  const [activeTab, setActiveTab] = useState('EVENTS'); // EVENTS | MEMBERS | PENDING
  const [loading, setLoading] = useState(true);

  const [clubs, setClubs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [lockedClubId, setLockedClubId] = useState(null);

  const [clubEvents, setClubEvents] = useState([]);
  const [clubMembers, setClubMembers] = useState([]);
  const [pendingApplicants, setPendingApplicants] = useState([]);

  // โหลดรายชื่อชมรมและตรวจสอบสิทธิ์ของอาจารย์ที่ปรึกษา
  useEffect(() => {
    async function initAdvisorData() {
      try {
        const [clubsRes, meRes, usersRes] = await Promise.all([
          fetch('/api/clubs', { cache: 'no-store' }),
          fetch('/api/auth/me', { cache: 'no-store' }),
          fetch('/api/admin/users', { cache: 'no-store' }),
        ]);

        let fetchedClubs = [];
        if (clubsRes.ok) {
          const clubsData = await clubsRes.json();
          if (clubsData.success) {
            fetchedClubs = clubsData.clubs || [];
            setClubs(fetchedClubs);
          }
        }

        let fetchedUsers = [];
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          if (usersData.success) {
            fetchedUsers = usersData.users || [];
            setAllUsers(fetchedUsers);
          }
        }

        let assignedClubId = null;
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.authenticated && meData.user) {
            setCurrentUser(meData.user);
            assignedClubId = meData.user.managed_club_id;
            const freshUser = fetchedUsers.find((u) => u.id === meData.user.id);
            if (freshUser && freshUser.managed_club_id) {
              assignedClubId = freshUser.managed_club_id;
            }
          }
        }

        if (assignedClubId && fetchedClubs.some((c) => c.id === Number(assignedClubId))) {
          setLockedClubId(Number(assignedClubId));
          setSelectedClubId(String(assignedClubId));
        } else if (fetchedClubs.length > 0) {
          setSelectedClubId(String(fetchedClubs[0].id));
        }
      } catch (error) {
        console.error('Failed to init advisor data:', error);
      } finally {
        setLoading(false);
      }
    }

    initAdvisorData();
  }, []);

  // โหลดกิจกรรม สมาชิก และใบสมัครของชมรมที่เลือก (Read-Only)
  const fetchClubReadOnlyData = useCallback(async (clubId) => {
    if (!clubId) return;
    try {
      const [eventsRes, appsRes] = await Promise.all([
        fetch(`/api/events?club_id=${clubId}`, { cache: 'no-store' }),
        fetch(`/api/applications?club_id=${clubId}`, { cache: 'no-store' }),
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        if (eventsData.success) {
          setClubEvents(eventsData.events || []);
        }
      }

      if (appsRes.ok) {
        const appsData = await appsRes.json();
        if (appsData.success) {
          const allApps = appsData.applications || [];
          setClubMembers(allApps.filter((a) => a.status === 'APPROVED'));
          setPendingApplicants(allApps.filter((a) => a.status === 'PENDING'));
        }
      }
    } catch (error) {
      console.error('Failed to fetch advisor club details:', error);
    }
  }, []);

  useEffect(() => {
    if (selectedClubId) {
      fetchClubReadOnlyData(selectedClubId);
    }
  }, [selectedClubId, fetchClubReadOnlyData]);

  const currentClub = clubs.find((c) => String(c.id) === String(selectedClubId)) || null;

  // ค้นหาชื่ออาจารย์ที่ปรึกษาของชมรมนี้จากตาราง users
  const clubAdvisor = allUsers.find(
    (u) => u.role === 'ADVISOR' && Number(u.managed_club_id) === Number(selectedClubId)
  );
  const advisorDisplayName =
    currentUser?.role === 'ADVISOR'
      ? currentUser.full_name
      : clubAdvisor?.full_name || 'ยังไม่ระบุอาจารย์ที่ปรึกษาในระบบ';

  const formatThaiDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* ส่วนหัวหน้าอาจารย์ที่ปรึกษา (Read-Only เท่านั้น) */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-[#2a0c1d] text-white p-6 sm:p-9 shadow-xl">
          <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-indigo-500/30 blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-bold text-indigo-200">
                <Eye className="w-3.5 h-3.5" />
                ADVISOR VIEW • โหมดดูข้อมูลอย่างเดียว (READ-ONLY)
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold">
                ข้อมูลชมรม: {currentClub ? currentClub.name : 'ยังไม่มีชมรมในระบบ'}
              </h1>

              {/* กรณีทดสอบผ่าน Role Preview (ยังไม่ได้ผูกชมรมประจำตัว) ให้เลือกสลับชมรมที่ต้องการดูได้ */}
              {!lockedClubId && clubs.length > 1 && (
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-xs text-indigo-200">เลือกชมรมที่ต้องการตรวจสอบ:</span>
                  <select
                    value={selectedClubId}
                    onChange={(e) => setSelectedClubId(e.target.value)}
                    className="px-3 py-1 rounded-xl bg-white/15 border border-white/25 text-xs font-bold text-white focus:outline-none"
                  >
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id} className="text-slate-900">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <p className="text-xs sm:text-sm text-slate-300">
                อาจารย์ที่ปรึกษา: {advisorDisplayName}
                {currentClub?.category ? ` • ${currentClub.category}` : ''}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 text-xs text-slate-200 flex items-center gap-2.5 max-w-sm">
              <Lock className="w-5 h-5 text-amber-300 shrink-0" />
              <span>
                สิทธิ์อาจารย์ที่ปรึกษาเป็นโหมดดูอย่างเดียว (Read-Only) ไม่สามารถสร้าง แก้ไข หรืออนุมัติข้อมูลในระบบได้
              </span>
            </div>
          </div>
        </section>

        {/* กล่องสรุปภาพรวมรายชมรม (Dashboard Stat Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#C81E6E] flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">สมาชิกชมรมปัจจุบัน</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {clubMembers.length} <span className="text-xs font-medium text-slate-400">คน</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">ใบสมัครรอประธานอนุมัติ</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {pendingApplicants.length}{' '}
                <span className="text-xs font-medium text-slate-400">รายการ</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">กิจกรรมที่ประกาศในเทอมนี้</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {clubEvents.length} <span className="text-xs font-medium text-slate-400">งาน</span>
              </p>
            </div>
          </div>
        </div>

        {/* แถบเมนูเลือกดูข้อมูล (ดูอย่างเดียวทั้งหมด) */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('EVENTS')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'EVENTS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            ดูกิจกรรมของชมรม ({clubEvents.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MEMBERS')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'MEMBERS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
            }`}
          >
            <Users className="w-4 h-4" />
            ดูรายชื่อสมาชิกชมรม ({clubMembers.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'PENDING'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            ดูคำขอสมัครที่รออนุมัติ ({pendingApplicants.length})
          </button>
        </div>

        {/* แท็บที่ 1: ดูกิจกรรมของชมรม (Read-Only ไม่มีปุ่มแก้ไข/ลบ) */}
        {activeTab === 'EVENTS' && (
          <>
            {loading ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-sm text-slate-400">
                กำลังโหลดข้อมูลกิจกรรม...
              </div>
            ) : clubEvents.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-sm text-slate-500">
                ชมรมนี้ยังไม่มีกิจกรรมที่ประกาศในขณะนี้
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clubEvents.map((ev) => (
                  <article
                    key={ev.id}
                    className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-48 bg-slate-200">
                        <img
                          src={ev.image_url || DEFAULT_EVENT_BANNER}
                          alt={ev.title}
                          className="w-full h-full object-cover"
                        />
                        {ev.hours && (
                          <span className="absolute top-3.5 left-3.5 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold shadow">
                            <Award className="w-3.5 h-3.5" />
                            {ev.hours}
                          </span>
                        )}
                      </div>

                      <div className="p-5 sm:p-6 space-y-2.5">
                        <h2 className="text-lg font-extrabold text-slate-900">{ev.title}</h2>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {ev.description}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#C81E6E] shrink-0" />
                        <span className="font-semibold text-slate-700">{ev.event_date}</span>
                        <span>({ev.event_time})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {/* แท็บที่ 2: ดูรายชื่อสมาชิกชมรม (Read-Only) */}
        {activeTab === 'MEMBERS' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                    <th className="py-3.5 px-5">รหัสนักศึกษา</th>
                    <th className="py-3.5 px-5">ชื่อ - นามสกุล</th>
                    <th className="py-3.5 px-5">คณะ / วิทยาลัย</th>
                    <th className="py-3.5 px-5">ตำแหน่งในชมรม</th>
                    <th className="py-3.5 px-5">วันที่เข้าร่วม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {clubMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        ยังไม่มีสมาชิกที่ผ่านการอนุมัติในชมรมนี้
                      </td>
                    </tr>
                  ) : (
                    clubMembers.map((member) => {
                      const isPresident = allUsers.some(
                        (u) =>
                          u.id === member.user_id &&
                          u.role === 'PRESIDENT' &&
                          Number(u.managed_club_id) === Number(selectedClubId)
                      );
                      return (
                        <tr key={member.id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-5 font-semibold text-slate-700">
                            {member.student_id}
                          </td>
                          <td className="py-3.5 px-5 font-bold text-slate-900">
                            {member.full_name}
                          </td>
                          <td className="py-3.5 px-5 text-slate-600">{member.faculty}</td>
                          <td className="py-3.5 px-5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                isPresident
                                  ? 'bg-pink-50 text-[#C81E6E]'
                                  : 'bg-indigo-50 text-indigo-700'
                              }`}
                            >
                              {isPresident ? 'ประธานชมรม' : 'สมาชิกชมรม'}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-slate-500">
                            {formatThaiDate(member.applied_at)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* แท็บที่ 3: ดูรายการคำขอสมัครที่รออนุมัติ (Read-Only ไม่มีปุ่มอนุมัติ/ปฏิเสธ) */}
        {activeTab === 'PENDING' && (
          <div className="space-y-4">
            {pendingApplicants.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-sm text-slate-500">
                ไม่มีคำขอสมัครที่ค้างการพิจารณาในขณะนี้
              </div>
            ) : (
              pendingApplicants.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold">
                        รหัส {app.student_id}
                      </span>
                      <span className="text-xs font-medium text-slate-500">{app.faculty}</span>
                      <span className="text-xs text-slate-400">
                        • สมัครเมื่อ {formatThaiDate(app.applied_at)}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900">{app.full_name}</h3>
                    {app.reason && (
                      <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        “{app.reason}”
                      </p>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold shrink-0 self-start sm:self-center">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    สถานะ: รอประธานชมรมพิจารณา
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}