'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarPlus,
  Settings,
  Sparkles,
  MapPin,
  Calendar,
  UserCheck,
  Link2,
  ExternalLink,
  Pencil,
  Trash2,
  ImagePlus,
  Upload,
  X,
  Save,
} from 'lucide-react';

const DEFAULT_EVENT_BANNER =
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80';

const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

// แปลงวันที่จากปฏิทิน "2026-12-05" -> "5 ธ.ค. 2026"
function formatInputDateToThai(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return `${d} ${THAI_MONTHS[m - 1]} ${y}`;
}

// แปลงวันที่ไทย "5 ธ.ค. 2026" กลับเป็น "2026-12-05" เพื่อใส่ในปฏิทินตอนกดแก้ไข
function parseThaiDateToInput(dateStr) {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr.trim())) {
    return dateStr.trim().slice(0, 10);
  }
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length < 3) return '';
  const day = parseInt(parts[parts.length - 3], 10);
  const monthIdx = THAI_MONTHS.indexOf(parts[parts.length - 2]);
  let year = parseInt(parts[parts.length - 1], 10);
  if (isNaN(day) || monthIdx === -1 || isNaN(year)) return '';
  if (year > 2400) year -= 543;
  return `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// แยกเวลา "16:30 - 19:00 น." -> { start: "16:30", end: "19:00" }
function parseTimeRange(timeStr) {
  if (!timeStr) return { start: '16:30', end: '19:00' };
  const matches = timeStr.match(/\d{1,2}:\d{2}/g);
  if (!matches || matches.length === 0) return { start: '16:30', end: '19:00' };
  const pad = (t) => {
    const [h, m] = t.split(':');
    return `${h.padStart(2, '0')}:${m}`;
  };
  return {
    start: pad(matches[0]),
    end: matches[1] ? pad(matches[1]) : pad(matches[0]),
  };
}

// รวมเวลาเริ่ม-เลิก -> "16:30 - 19:00 น."
function formatTimeRange(start, end) {
  if (!start && !end) return '16:30 - 19:00 น.';
  if (start && end) return `${start} - ${end} น.`;
  return `${start || end} น.`;
}

export default function PresidentDashboardPage() {
  const [activeTab, setActiveTab] = useState('EVENTS');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // ข้อมูลชมรมที่กำลังจัดการ
  const [clubs, setClubs] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [lockedClubId, setLockedClubId] = useState(null);

  // ข้อมูลใบสมัครและสมาชิกจากฐานข้อมูลจริง
  const [pendingList, setPendingList] = useState([]);
  const [membersList, setMembersList] = useState([]);

  // State สำหรับโพสต์ประกาศกิจกรรมใหม่ (ใช้ปฏิทินและตัวเลือกเวลา)
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('16:30');
  const [eventEndTime, setEventEndTime] = useState('19:00');
  const [eventLocation, setEventLocation] = useState('');
  const [eventHours, setEventHours] = useState('+3 ชม. กิจกรรม');
  const [eventFormUrl, setEventFormUrl] = useState('');
  const [imageMode, setImageMode] = useState('UPLOAD'); // UPLOAD | URL
  const [eventImage, setEventImage] = useState('');
  const [submittingEvent, setSubmittingEvent] = useState(false);

  // รายการกิจกรรมของชมรมจากฐานข้อมูลจริง
  const [clubEvents, setClubEvents] = useState([]);

  // State สำหรับ Modal แก้ไขข้อมูลกิจกรรมทั้งหมด
  const [editingEvent, setEditingEvent] = useState(null);
  const [editImageMode, setEditImageMode] = useState('UPLOAD');
  const [savingEdit, setSavingEdit] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // โหลดรายชื่อชมรม + ตรวจสอบว่าประธานคนนี้ผูกอยู่กับชมรมไหน
  useEffect(() => {
    async function initClub() {
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

        let assignedClubId = null;
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.authenticated && meData.user) {
            assignedClubId = meData.user.managed_club_id;
            if (usersRes.ok) {
              const usersData = await usersRes.json();
              const freshUser = (usersData.users || []).find((u) => u.id === meData.user.id);
              if (freshUser && freshUser.managed_club_id) {
                assignedClubId = freshUser.managed_club_id;
              }
            }
          }
        }

        if (assignedClubId && fetchedClubs.some((c) => c.id === Number(assignedClubId))) {
          setLockedClubId(Number(assignedClubId));
          setSelectedClubId(String(assignedClubId));
        } else if (fetchedClubs.length > 0) {
          setSelectedClubId(String(fetchedClubs[0].id));
        }
      } catch (err) {
        console.error('Init president club error:', err);
      } finally {
        setLoading(false);
      }
    }

    initClub();
  }, []);

  // โหลดกิจกรรม + ใบสมัคร + สมาชิก ของชมรมที่เลือก
  const fetchClubWorkspaceData = useCallback(async (clubId) => {
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
          setPendingList(allApps.filter((a) => a.status === 'PENDING'));
          setMembersList(allApps.filter((a) => a.status === 'APPROVED'));
        }
      }
    } catch (err) {
      console.error('Fetch club workspace error:', err);
    }
  }, []);

  useEffect(() => {
    if (selectedClubId) {
      fetchClubWorkspaceData(selectedClubId);
    }
  }, [selectedClubId, fetchClubWorkspaceData]);

  const currentClub = clubs.find((c) => String(c.id) === String(selectedClubId)) || null;
  const approvalMode = currentClub?.approval_mode || 'MANUAL';

  // เปลี่ยนโหมดรับสมัคร (MANUAL / AUTO) ลงฐานข้อมูลจริง
  const handleChangeApprovalMode = async (mode) => {
    if (!currentClub) return;
    try {
      const res = await fetch('/api/clubs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentClub.id, approval_mode: mode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClubs(
          clubs.map((c) => (c.id === currentClub.id ? { ...c, approval_mode: mode } : c))
        );
        showToast(
          mode === 'AUTO'
            ? 'เปลี่ยนเป็นโหมด "อนุมัติทันที (Auto)" แล้ว'
            : 'เปลี่ยนเป็นโหมด "รอประธานอนุมัติ" แล้ว'
        );
      }
    } catch {
      showToast('เปลี่ยนโหมดไม่สำเร็จ');
    }
  };

  // ฟังก์ชันย่อขนาดรูปภาพอัตโนมัติ
  const compressImageFile = (file, onSuccess) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 800;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        onSuccess(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // อนุมัติเข้าชมรมลงฐานข้อมูลจริง
  const handleApprove = async (applicant) => {
    try {
      const res = await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: applicant.id, status: 'APPROVED' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchClubWorkspaceData(selectedClubId);
        showToast(`อนุมัติ ${applicant.full_name} เข้าชมรมเรียบร้อยแล้ว`);
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการอนุมัติ');
    }
  };

  // ปฏิเสธคำขอลงฐานข้อมูลจริง
  const handleReject = async (applicant) => {
    if (!confirm(`ยืนยันการปฏิเสธคำขอของ ${applicant.full_name}?`)) return;
    try {
      const res = await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: applicant.id, status: 'REJECTED' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchClubWorkspaceData(selectedClubId);
        showToast(`ปฏิเสธคำขอของ ${applicant.full_name} แล้ว`);
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการปฏิเสธคำขอ');
    }
  };

  // สร้างกิจกรรมใหม่ลง TiDB
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!selectedClubId) {
      showToast('กรุณาสร้างชมรมในหน้า Admin ก่อนสร้างกิจกรรม');
      return;
    }
    if (!eventTitle || !eventDate || !eventLocation) return;

    if (eventStartTime && eventEndTime && eventStartTime >= eventEndTime) {
      showToast('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มกิจกรรม');
      return;
    }

    setSubmittingEvent(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          club_id: Number(selectedClubId),
          title: eventTitle.trim(),
          description: eventDescription.trim() || 'รายละเอียดกิจกรรมประจำสัปดาห์ของชมรม',
          event_date: formatInputDateToThai(eventDate),
          event_time: formatTimeRange(eventStartTime, eventEndTime),
          location: eventLocation.trim(),
          hours: eventHours,
          image_url: eventImage.trim() || DEFAULT_EVENT_BANNER,
          registration_url: eventFormUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'สร้างกิจกรรมไม่สำเร็จ');
        setSubmittingEvent(false);
        return;
      }

      setEventTitle('');
      setEventDescription('');
      setEventDate('');
      setEventStartTime('16:30');
      setEventEndTime('19:00');
      setEventLocation('');
      setEventFormUrl('');
      setEventImage('');
      await fetchClubWorkspaceData(selectedClubId);
      showToast('เผยแพร่กิจกรรมลงฐานข้อมูลเรียบร้อยแล้ว!');
    } catch {
      showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setSubmittingEvent(false);
    }
  };

  const openEditModal = (ev) => {
    const parsedTime = parseTimeRange(ev.event_time);
    setEditingEvent({
      ...ev,
      dateInput: parseThaiDateToInput(ev.event_date),
      startTimeInput: parsedTime.start,
      endTimeInput: parsedTime.end,
    });
    setEditImageMode('UPLOAD');
  };

  // บันทึกการแก้ไขกิจกรรมลง TiDB
  const handleSaveEditedEvent = async (e) => {
    e.preventDefault();
    if (!editingEvent || !editingEvent.title || !editingEvent.dateInput || !editingEvent.location) {
      return;
    }

    if (
      editingEvent.startTimeInput &&
      editingEvent.endTimeInput &&
      editingEvent.startTimeInput >= editingEvent.endTimeInput
    ) {
      showToast('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มกิจกรรม');
      return;
    }

    setSavingEdit(true);
    try {
      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingEvent.id,
          title: editingEvent.title.trim(),
          description: editingEvent.description || '',
          event_date: formatInputDateToThai(editingEvent.dateInput),
          event_time: formatTimeRange(editingEvent.startTimeInput, editingEvent.endTimeInput),
          location: editingEvent.location.trim(),
          hours: editingEvent.hours || '+3 ชม. กิจกรรม',
          image_url: editingEvent.image_url?.trim() || DEFAULT_EVENT_BANNER,
          registration_url: editingEvent.registration_url?.trim() || '',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'แก้ไขกิจกรรมไม่สำเร็จ');
        setSavingEdit(false);
        return;
      }

      setEditingEvent(null);
      await fetchClubWorkspaceData(selectedClubId);
      showToast('บันทึกการแก้ไขข้อมูลกิจกรรมเรียบร้อยแล้ว');
    } catch {
      showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setSavingEdit(false);
    }
  };

  // ลบกิจกรรมออกจาก TiDB
  const handleDeleteEvent = async (id, title) => {
    if (!confirm(`ต้องการลบกิจกรรม "${title}" ใช่หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/events?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchClubWorkspaceData(selectedClubId);
        showToast(`ลบกิจกรรม "${title}" เรียบร้อยแล้ว`);
      }
    } catch {
      showToast('ลบกิจกรรมไม่สำเร็จ');
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

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Navbar />

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs sm:text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* ส่วนหัวแดชบอร์ดประธานชมรม */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-[#2a0c1d] to-purple-950 text-white p-6 sm:p-9 shadow-xl">
          <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#C81E6E]/35 blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-400/30 text-xs font-bold text-pink-200">
                <Sparkles className="w-3.5 h-3.5" />
                PRESIDENT WORKSPACE • {currentClub ? currentClub.category : 'ยังไม่มีชมรมในระบบ'}
              </span>

              <h1 className="text-2xl sm:text-3xl font-extrabold">
                จัดการชมรม: {currentClub ? currentClub.name : 'กรุณาเพิ่มชมรมในหน้า Admin ก่อน'}
              </h1>

              {!lockedClubId && clubs.length > 1 && (
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-xs text-pink-200">เลือกชมรมที่ต้องการจัดการ:</span>
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
                อนุมัติใบสมัครสมาชิกใหม่ ตรวจสอบรายชื่อ และโพสต์หรือแก้ไขกิจกรรมของชมรม
              </p>
            </div>

            {currentClub && (
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 space-y-2 shrink-0">
                <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-pink-400" />
                  รูปแบบการอนุมัติสมาชิกใหม่
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleChangeApprovalMode('MANUAL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      approvalMode === 'MANUAL'
                        ? 'bg-[#C81E6E] text-white shadow'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    รอประธานอนุมัติ
                  </button>
                  <button
                    onClick={() => handleChangeApprovalMode('AUTO')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      approvalMode === 'AUTO'
                        ? 'bg-emerald-500 text-slate-950 shadow'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    อนุมัติทันที (Auto)
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="bg-white/10 rounded-2xl p-3.5">
              <p className="text-xs text-slate-300">รออนุมัติ</p>
              <p className="text-xl sm:text-2xl font-extrabold text-amber-300 mt-0.5">
                {pendingList.length} <span className="text-xs font-normal text-white">คน</span>
              </p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3.5">
              <p className="text-xs text-slate-300">สมาชิกทั้งหมด</p>
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-300 mt-0.5">
                {membersList.length} <span className="text-xs font-normal text-white">คน</span>
              </p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3.5">
              <p className="text-xs text-slate-300">กิจกรรมที่ประกาศ</p>
              <p className="text-xl sm:text-2xl font-extrabold text-pink-300 mt-0.5">
                {clubEvents.length} <span className="text-xs font-normal text-white">รายการ</span>
              </p>
            </div>
          </div>
        </section>

        {/* แถบเมนูเลือกแท็บ */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('EVENTS')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'EVENTS'
                ? 'bg-[#C81E6E] text-white shadow-md shadow-pink-500/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-pink-300'
            }`}
          >
            <CalendarPlus className="w-4 h-4" />
            จัดการกิจกรรม & รูปโปสเตอร์
          </button>

          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'PENDING'
                ? 'bg-[#C81E6E] text-white shadow-md shadow-pink-500/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-pink-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            คำขอสมัครเข้าชมรม ({pendingList.length})
          </button>

          <button
            onClick={() => setActiveTab('MEMBERS')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'MEMBERS'
                ? 'bg-[#C81E6E] text-white shadow-md shadow-pink-500/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-pink-300'
            }`}
          >
            <Users className="w-4 h-4" />
            รายชื่อสมาชิก ({membersList.length})
          </button>
        </div>

        {/* แท็บจัดการกิจกรรม */}
        {activeTab === 'EVENTS' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ฟอร์มสร้างกิจกรรมใหม่ */}
            <form
              onSubmit={handleCreateEvent}
              className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4 h-fit"
            >
              <h2 className="text-lg font-extrabold text-slate-900">สร้างประกาศกิจกรรมใหม่</h2>

              {/* กล่องอัปโหลดรูปโปสเตอร์กิจกรรม */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <ImagePlus className="w-4 h-4 text-[#C81E6E]" />
                    รูปภาพปก / โปสเตอร์กิจกรรม
                  </label>
                  <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setImageMode('UPLOAD')}
                      className={`px-2 py-0.5 rounded-md cursor-pointer transition ${
                        imageMode === 'UPLOAD' ? 'bg-white text-[#C81E6E] shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      อัปโหลดไฟล์
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode('URL')}
                      className={`px-2 py-0.5 rounded-md cursor-pointer transition ${
                        imageMode === 'URL' ? 'bg-white text-[#C81E6E] shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      วางลิงก์รูป
                    </button>
                  </div>
                </div>

                {eventImage ? (
                  <div className="relative h-40 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img
                      src={eventImage}
                      alt="ตัวอย่างโปสเตอร์กิจกรรม"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setEventImage('')}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/75 text-white hover:bg-red-600 transition cursor-pointer"
                      title="ลบรูปภาพ"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : imageMode === 'UPLOAD' ? (
                  <label className="flex flex-col items-center justify-center h-32 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#C81E6E] bg-slate-50/70 hover:bg-pink-50/30 transition cursor-pointer p-4 text-center">
                    <Upload className="w-6 h-6 text-[#C81E6E] mb-1.5" />
                    <span className="text-xs font-bold text-slate-700">
                      คลิกเพื่อเลือกรูปจากคอมพิวเตอร์ หรือมือถือ
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      รองรับ JPG, PNG, WebP (ย่อขนาดอัตโนมัติ)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => compressImageFile(e.target.files?.[0], setEventImage)}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <input
                    type="url"
                    value={eventImage}
                    onChange={(e) => setEventImage(e.target.value)}
                    placeholder="วางลิงก์รูปภาพ https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#C81E6E]"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อกิจกรรม *</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="เช่น ซ้อมทีมแข่ง Valorant ประจำสัปดาห์"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#C81E6E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รายละเอียดกิจกรรม (แสดงในหน้าดูเพิ่มเติม)
                </label>
                <textarea
                  rows={3}
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="อธิบายกติกา คุณสมบัติผู้เข้าร่วม หรือสิ่งที่ต้องเตรียมมา..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#C81E6E]"
                />
              </div>

              {/* เลือกวันที่จากปฏิทิน */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันที่จัดกิจกรรม *
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[#C81E6E]"
                />
              </div>

              {/* เลือกเวลาเริ่ม - เวลาสิ้นสุด */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เวลาเริ่ม *
                  </label>
                  <input
                    type="time"
                    required
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[#C81E6E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เวลาสิ้นสุด *
                  </label>
                  <input
                    type="time"
                    required
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[#C81E6E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">สถานที่ / ห้อง *</label>
                <input
                  type="text"
                  required
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="เช่น อาคาร 15 ห้อง 15-401"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#C81E6E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ลิงก์ฟอร์มลงทะเบียน (Google Form / Link)
                </label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={eventFormUrl}
                    onChange={(e) => setEventFormUrl(e.target.value)}
                    placeholder="https://forms.gle/..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#C81E6E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชั่วโมงกิจกรรมที่ได้รับ</label>
                <select
                  value={eventHours}
                  onChange={(e) => setEventHours(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option>+2 ชม. กิจกรรม</option>
                  <option>+3 ชม. กิจกรรม</option>
                  <option>+4 ชม. กิจกรรม</option>
                  <option>+6 ชม. กิจกรรม</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submittingEvent || !selectedClubId}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C81E6E] to-pink-600 disabled:opacity-60 text-white text-sm font-semibold shadow-md cursor-pointer"
              >
                {submittingEvent ? 'กำลังบันทึก...' : 'โพสต์ประกาศกิจกรรม'}
              </button>
            </form>

            {/* รายการกิจกรรมของชมรม */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">
                กิจกรรมที่เผยแพร่อยู่ ({clubEvents.length})
              </h3>

              {loading ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-sm text-slate-400">
                  กำลังโหลดรายการกิจกรรม...
                </div>
              ) : clubEvents.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-sm text-slate-500">
                  ยังไม่มีกิจกรรมที่ประกาศ สามารถสร้างกิจกรรมใหม่ได้จากฟอร์มด้านซ้าย
                </div>
              ) : (
                clubEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-44 h-40 sm:h-auto bg-slate-200 shrink-0">
                        <img
                          src={ev.image_url || DEFAULT_EVENT_BANNER}
                          alt={ev.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="p-5 flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold">
                              {ev.hours}
                            </span>
                            <h4 className="text-base font-extrabold text-slate-900">{ev.title}</h4>
                            <p className="text-xs text-slate-600 line-clamp-2">{ev.description}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(ev.id, ev.title)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer shrink-0"
                            title="ลบกิจกรรมนี้"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#C81E6E]" />
                            {ev.event_date} ({ev.event_time})
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {ev.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* แถบแสดงลิงก์ Form + ปุ่มแก้ไขข้อมูลทั้งหมด */}
                    <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs min-w-0">
                        <Link2 className="w-4 h-4 text-[#C81E6E] shrink-0" />
                        {ev.registration_url ? (
                          <a
                            href={ev.registration_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#C81E6E] font-semibold truncate hover:underline flex items-center gap-1"
                          >
                            {ev.registration_url}
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-amber-700 font-medium">ยังไม่ได้แนบลิงก์ Form</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => openEditModal(ev)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-[#C81E6E] text-white text-xs font-semibold transition cursor-pointer shrink-0"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        แก้ไขข้อมูล / รูปภาพ / ลิงก์ Form
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* แท็บอนุมัติใบสมัคร */}
        {activeTab === 'PENDING' && (
          <div className="space-y-4">
            {pendingList.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2 shadow-sm">
                <UserCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-base font-bold text-slate-800">ไม่มีคำขอสมัครที่ค้างตรวจสอบ</p>
              </div>
            ) : (
              pendingList.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-pink-50 text-[#C81E6E] text-xs font-bold">
                        รหัส {app.student_id}
                      </span>
                      <span className="text-xs font-medium text-slate-500">{app.faculty}</span>
                      <span className="text-xs text-slate-400">
                        • {formatThaiDate(app.applied_at)}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      {app.full_name}
                    </h3>
                    {app.reason && (
                      <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        “{app.reason}”
                      </p>
                    )}
                    <p className="text-xs text-slate-500">ช่องทางติดต่อ: {app.contact}</p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0">
                    <button
                      onClick={() => handleReject(app)}
                      className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      ปฏิเสธ
                    </button>
                    <button
                      onClick={() => handleApprove(app)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      อนุมัติเข้าชมรม
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* แท็บรายชื่อสมาชิกชมรม */}
        {activeTab === 'MEMBERS' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                    <th className="py-3.5 px-5">รหัสนักศึกษา</th>
                    <th className="py-3.5 px-5">ชื่อ - นามสกุล</th>
                    <th className="py-3.5 px-5">คณะ / วิทยาลัย</th>
                    <th className="py-3.5 px-5">ช่องทางติดต่อ</th>
                    <th className="py-3.5 px-5">วันที่เข้าร่วม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {membersList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        ยังไม่มีสมาชิกที่อนุมัติเข้าชมรม
                      </td>
                    </tr>
                  ) : (
                    membersList.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-5 font-semibold text-slate-700">
                          {member.student_id}
                        </td>
                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          {member.full_name}
                        </td>
                        <td className="py-3.5 px-5 text-slate-600">{member.faculty}</td>
                        <td className="py-3.5 px-5 text-slate-600">{member.contact}</td>
                        <td className="py-3.5 px-5 text-slate-500">
                          {formatThaiDate(member.applied_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL แก้ไขข้อมูลกิจกรรมทั้งหมด */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveEditedEvent}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 my-8"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[#C81E6E] uppercase">Edit Event</span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                  แก้ไขข้อมูลและรูปภาพกิจกรรม
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* เปลี่ยนรูปภาพปกกิจกรรม */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <ImagePlus className="w-4 h-4 text-[#C81E6E]" />
                  รูปภาพปก / โปสเตอร์กิจกรรม
                </label>
                <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setEditImageMode('UPLOAD')}
                    className={`px-2 py-0.5 rounded-md cursor-pointer transition ${
                      editImageMode === 'UPLOAD'
                        ? 'bg-white text-[#C81E6E] shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    อัปโหลดไฟล์ใหม่
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditImageMode('URL')}
                    className={`px-2 py-0.5 rounded-md cursor-pointer transition ${
                      editImageMode === 'URL'
                        ? 'bg-white text-[#C81E6E] shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    วางลิงก์รูป
                  </button>
                </div>
              </div>

              {editingEvent.image_url && (
                <div className="relative h-36 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={editingEvent.image_url}
                    alt="รูปปกกิจกรรม"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingEvent({ ...editingEvent, image_url: '' })}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-slate-900/80 text-white text-[11px] font-semibold hover:bg-red-600 transition cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    ลบรูปนี้
                  </button>
                </div>
              )}

              {editImageMode === 'UPLOAD' ? (
                <label className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-slate-300 hover:border-[#C81E6E] bg-slate-50 hover:bg-pink-50/30 text-xs font-semibold text-slate-700 transition cursor-pointer">
                  <Upload className="w-4 h-4 text-[#C81E6E]" />
                  <span>เลือกรูปใหม่จากเครื่อง (JPG, PNG, WebP)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      compressImageFile(e.target.files?.[0], (base64) =>
                        setEditingEvent({ ...editingEvent, image_url: base64 })
                      )
                    }
                    className="hidden"
                  />
                </label>
              ) : (
                <input
                  type="url"
                  value={editingEvent.image_url || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, image_url: e.target.value })}
                  placeholder="วางลิงก์รูปภาพใหม่ https://..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#C81E6E]"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อกิจกรรม *</label>
              <input
                type="text"
                required
                value={editingEvent.title}
                onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#C81E6E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">รายละเอียดกิจกรรม</label>
              <textarea
                rows={3}
                value={editingEvent.description || ''}
                onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#C81E6E]"
              />
            </div>

            {/* ปฏิทินเลือกวันที่ */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันที่จัดกิจกรรม *
              </label>
              <input
                type="date"
                required
                value={editingEvent.dateInput || ''}
                onChange={(e) => setEditingEvent({ ...editingEvent, dateInput: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[#C81E6E]"
              />
            </div>

            {/* ตัวเลือกเวลาเริ่ม - เวลาสิ้นสุด */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เวลาเริ่ม *
                </label>
                <input
                  type="time"
                  required
                  value={editingEvent.startTimeInput || ''}
                  onChange={(e) =>
                    setEditingEvent({ ...editingEvent, startTimeInput: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[#C81E6E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เวลาสิ้นสุด *
                </label>
                <input
                  type="time"
                  required
                  value={editingEvent.endTimeInput || ''}
                  onChange={(e) =>
                    setEditingEvent({ ...editingEvent, endTimeInput: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[#C81E6E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">สถานที่ / ห้อง *</label>
                <input
                  type="text"
                  required
                  value={editingEvent.location}
                  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#C81E6E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชั่วโมงกิจกรรม</label>
                <select
                  value={editingEvent.hours || '+3 ชม. กิจกรรม'}
                  onChange={(e) => setEditingEvent({ ...editingEvent, hours: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option>+2 ชม. กิจกรรม</option>
                  <option>+3 ชม. กิจกรรม</option>
                  <option>+4 ชม. กิจกรรม</option>
                  <option>+6 ชม. กิจกรรม</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ลิงก์ฟอร์มลงทะเบียน (Google Form / Link)
              </label>
              <div className="relative">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={editingEvent.registration_url || ''}
                  onChange={(e) =>
                    setEditingEvent({ ...editingEvent, registration_url: e.target.value })
                  }
                  placeholder="https://forms.gle/..."
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#C81E6E]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#C81E6E] to-pink-600 disabled:opacity-60 text-white text-sm font-semibold shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {savingEdit ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}