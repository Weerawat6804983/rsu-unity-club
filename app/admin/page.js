'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import {
  Shield,
  UserCog,
  Building2,
  Search,
  CheckCircle2,
  Plus,
  Users,
  Calendar,
  ShieldCheck,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Crown,
  GraduationCap,
  Table2,
  Filter,
  X,
  RotateCcw,
} from 'lucide-react';

const CLUB_CATEGORIES = [
  'ฝ่ายวิชาการและนวัตกรรม',
  'ฝ่ายศิลปวัฒนธรรมและดนตรี',
  'ฝ่ายกีฬาและนันทนาการ',
  'ฝ่ายบำเพ็ญประโยชน์และสิ่งแวดล้อม',
  'ฝ่ายสื่อสารมวลชนและเทคโนโลยี',
];

const USERS_PER_PAGE = 10;

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState('CLUBS'); // CLUBS | ROLES | REPORTS
  const [users, setUsers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // State สำหรับค้นหาและกรองรายชื่อในแท็บเปลี่ยนยศ
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // ALL | STUDENT | PRESIDENT | ADVISOR | ADMIN
  const [clubFilter, setClubFilter] = useState('ALL'); // ALL | UNASSIGNED | <club_id>
  const [userPage, setUserPage] = useState(1);

  const [toast, setToast] = useState('');

  // State สำหรับกดคลิกเลื่อนลงมาดูข้อมูลประธาน/อาจารย์/จำนวนสมาชิกของแต่ละชมรม
  const [expandedClubId, setExpandedClubId] = useState(null);

  // State สำหรับหน้าต่างแต่งตั้งยศ
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('STUDENT');
  const [selectedClubId, setSelectedClubId] = useState('');

  // State สำหรับสร้างชมรมใหม่
  const [newClubName, setNewClubName] = useState('');
  const [newClubCategory, setNewClubCategory] = useState(CLUB_CATEGORIES[0]);
  const [newClubDescription, setNewClubDescription] = useState('');
  const [submittingClub, setSubmittingClub] = useState(false);

  // State สำหรับหน้าต่างแก้ไขชมรม
  const [editingClub, setEditingClub] = useState(null);
  const [editClubName, setEditClubName] = useState('');
  const [editClubCategory, setEditClubCategory] = useState(CLUB_CATEGORIES[0]);
  const [editClubFaculty, setEditClubFaculty] = useState('');
  const [editClubBadge, setEditClubBadge] = useState('');
  const [editClubDescription, setEditClubDescription] = useState('');
  const [savingClubEdit, setSavingClubEdit] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchAllData = async () => {
    try {
      const [clubsRes, usersRes, eventsRes] = await Promise.all([
        fetch('/api/clubs', { cache: 'no-store' }),
        fetch('/api/admin/users', { cache: 'no-store' }),
        fetch('/api/events', { cache: 'no-store' }),
      ]);

      if (clubsRes.ok) {
        const clubsData = await clubsRes.json();
        if (clubsData.success) setClubs(clubsData.clubs || []);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.success) setUsers(usersData.users || []);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        if (eventsData.success) setEvents(eventsData.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // รีเซ็ตกลับไปหน้า 1 ทุกครั้งที่มีการพิมพ์ค้นหาหรือเปลี่ยนตัวกรอง
  useEffect(() => {
    setUserPage(1);
  }, [searchUser, roleFilter, clubFilter]);

  // Helper หาประธานชมรมและอาจารย์ที่ปรึกษาของแต่ละชมรม
  const getClubLeadership = (clubId) => {
    const presidents = users.filter(
      (u) => u.role === 'PRESIDENT' && Number(u.managed_club_id) === Number(clubId)
    );
    const advisors = users.filter(
      (u) => u.role === 'ADVISOR' && Number(u.managed_club_id) === Number(clubId)
    );
    const clubEventsCount = events.filter(
      (ev) => Number(ev.club_id) === Number(clubId)
    ).length;

    return {
      presidents,
      advisors,
      presidentNames:
        presidents.length > 0 ? presidents.map((p) => p.full_name).join(', ') : 'ยังไม่แต่งตั้ง',
      advisorNames:
        advisors.length > 0 ? advisors.map((a) => a.full_name).join(', ') : 'ยังไม่แต่งตั้ง',
      clubEventsCount,
    };
  };

  const toggleExpandClub = (clubId) => {
    setExpandedClubId((prev) => (prev === clubId ? null : clubId));
  };

  const openRoleModal = (user) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    if (user.managed_club_id) {
      setSelectedClubId(String(user.managed_club_id));
    } else if (clubs.length > 0) {
      setSelectedClubId(String(clubs[0].id));
    } else {
      setSelectedClubId('');
    }
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          role: selectedRole,
          managed_club_id:
            selectedRole === 'PRESIDENT' || selectedRole === 'ADVISOR'
              ? selectedClubId || null
              : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'อัปเดตสิทธิ์ไม่สำเร็จ');
        return;
      }

      await fetchAllData();
      showToast(`อัปเดตสิทธิ์ของ ${editingUser.full_name} เป็น ${selectedRole} เรียบร้อยแล้ว`);
      setEditingUser(null);
    } catch {
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const handleAddClub = async (e) => {
    e.preventDefault();
    if (!newClubName.trim()) return;

    setSubmittingClub(true);
    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClubName.trim(),
          category: newClubCategory,
          faculty: 'ส่วนกลาง (ทุกคณะ)',
          description:
            newClubDescription.trim() ||
            'ชมรมจัดตั้งใหม่ภายใต้สำนักงานกิจการนักศึกษา มหาวิทยาลัยรังสิต',
          approval_mode: 'AUTO',
          highlight_badge: 'เปิดรับสมัคร',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'เพิ่มชมรมไม่สำเร็จ');
        setSubmittingClub(false);
        return;
      }

      setNewClubName('');
      setNewClubDescription('');
      await fetchAllData();
      showToast(`เพิ่ม "${newClubName.trim()}" ลงฐานข้อมูลเรียบร้อยแล้ว`);
    } catch {
      showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setSubmittingClub(false);
    }
  };

  const openEditClubModal = (club) => {
    setEditingClub(club);
    setEditClubName(club.name || '');
    setEditClubCategory(club.category || CLUB_CATEGORIES[0]);
    setEditClubFaculty(club.faculty || 'ส่วนกลาง (ทุกคณะ)');
    setEditClubBadge(club.highlight_badge || 'เปิดรับสมัคร');
    setEditClubDescription(club.description || '');
  };

  const handleUpdateClub = async (e) => {
    e.preventDefault();
    if (!editingClub || !editClubName.trim()) return;

    setSavingClubEdit(true);
    try {
      const res = await fetch('/api/clubs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingClub.id,
          name: editClubName.trim(),
          category: editClubCategory,
          faculty: editClubFaculty.trim() || 'ส่วนกลาง (ทุกคณะ)',
          highlight_badge: editClubBadge.trim() || 'เปิดรับสมัคร',
          description: editClubDescription.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'แก้ไขข้อมูลชมรมไม่สำเร็จ');
        setSavingClubEdit(false);
        return;
      }

      await fetchAllData();
      showToast(`แก้ไขข้อมูล "${editClubName.trim()}" เรียบร้อยแล้ว`);
      setEditingClub(null);
    } catch {
      showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setSavingClubEdit(false);
    }
  };

  const handleDeleteClub = async (club) => {
    const confirmed = window.confirm(
      `ยืนยันการลบชมรม "${club.name}" ใช่หรือไม่?\n(กิจกรรม ใบสมัคร และสิทธิ์การดูแลชมรมนี้จะถูกลบออกทั้งหมด)`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/clubs?id=${club.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.message || 'ลบชมรมไม่สำเร็จ');
        return;
      }

      if (expandedClubId === club.id) setExpandedClubId(null);
      await fetchAllData();
      showToast(`ลบชมรม "${club.name}" ออกจากระบบเรียบร้อยแล้ว`);
    } catch {
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  // กรองรายชื่อผู้ใช้งาน (รองรับค้นหา + กรองยศ + กรองชมรม)
  const filteredUsers = users.filter((u) => {
    const q = searchUser.trim().toLowerCase();
    const matchSearch =
      !q ||
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.student_id || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.faculty || '').toLowerCase().includes(q) ||
      (u.managed_club_name || '').toLowerCase().includes(q);

    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;

    const matchClub =
      clubFilter === 'ALL' ||
      (clubFilter === 'UNASSIGNED'
        ? !u.managed_club_id && u.role !== 'ADMIN'
        : String(u.managed_club_id) === String(clubFilter));

    return matchSearch && matchRole && matchClub;
  });

  // คำนวณการแบ่งหน้าสำหรับตารางผู้ใช้งาน
  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const safeUserPage = Math.min(userPage, totalUserPages);
  const paginatedUsers = filteredUsers.slice(
    (safeUserPage - 1) * USERS_PER_PAGE,
    safeUserPage * USERS_PER_PAGE
  );

  const hasActiveUserFilters =
    searchUser.trim() !== '' || roleFilter !== 'ALL' || clubFilter !== 'ALL';

  const resetUserFilters = () => {
    setSearchUser('');
    setRoleFilter('ALL');
    setClubFilter('ALL');
    setUserPage(1);
  };

  const roleCounts = {
    ALL: users.length,
    STUDENT: users.filter((u) => u.role === 'STUDENT').length,
    PRESIDENT: users.filter((u) => u.role === 'PRESIDENT').length,
    ADVISOR: users.filter((u) => u.role === 'ADVISOR').length,
    ADMIN: users.filter((u) => u.role === 'ADMIN').length,
  };

  const leaderCount = roleCounts.PRESIDENT + roleCounts.ADVISOR;

  // คำนวณสถิติสำหรับกราฟแท่งและตารางสรุป
  const sortedClubsByMembers = [...clubs].sort(
    (a, b) => Number(b.member_count || 0) - Number(a.member_count || 0)
  );
  const maxMemberCount = Math.max(
    1,
    ...clubs.map((c) => Number(c.member_count || 0))
  );
  const totalMembersAllClubs = clubs.reduce(
    (sum, c) => sum + Number(c.member_count || 0),
    0
  );

  const categoryStats = CLUB_CATEGORIES.map((cat) => {
    const clubsInCat = clubs.filter((c) => c.category === cat);
    const membersInCat = clubsInCat.reduce(
      (sum, c) => sum + Number(c.member_count || 0),
      0
    );
    return {
      category: cat,
      clubCount: clubsInCat.length,
      memberCount: membersInCat,
    };
  });
  const maxCategoryMembers = Math.max(
    1,
    ...categoryStats.map((item) => item.memberCount)
  );

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
        {/* ส่วนหัว Admin Panel */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-[#2a0c1d] text-white p-6 sm:p-9 shadow-xl">
          <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#C81E6E]/30 blur-3xl" />

          <div className="relative z-10 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-pink-300">
              <Shield className="w-3.5 h-3.5" />
              SYSTEM ADMINISTRATOR • สำนักงานกิจการนักศึกษา
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              ศูนย์ควบคุมสิทธิ์และจัดการชมรม (Admin Panel)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              จัดตั้ง แก้ไข หรือลบชมรม ตรวจสอบผู้รับผิดชอบ และดูรายงานสถิติภาพรวมทั้งระบบ
            </p>
          </div>
        </section>

        {/* กล่องสรุปภาพรวมทั้งระบบ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#C81E6E] flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">ชมรมทั้งหมดในระบบ</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {clubs.length} <span className="text-xs font-medium text-slate-400">ชมรม</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">ผู้ใช้งานในระบบ</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {users.length} <span className="text-xs font-medium text-slate-400">บัญชี</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">ประธาน & อาจารย์</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {leaderCount} <span className="text-xs font-medium text-slate-400">บัญชี</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">กิจกรรมทั้งหมด</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {events.length} <span className="text-xs font-medium text-slate-400">งาน</span>
              </p>
            </div>
          </div>
        </div>

        {/* แถบเมนูเลือกแท็บ */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('CLUBS')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'CLUBS'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
            }`}
          >
            <Building2 className="w-4 h-4 text-pink-400" />
            จัดการชมรมทั้งหมด ({clubs.length} ชมรม)
          </button>

          <button
            onClick={() => setActiveTab('ROLES')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'ROLES'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
            }`}
          >
            <UserCog className="w-4 h-4 text-pink-400" />
            แต่งตั้งตำแหน่งและสิทธิ์ผู้ใช้งาน ({users.length} บัญชี)
          </button>

          <button
            onClick={() => setActiveTab('REPORTS')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'REPORTS'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-pink-400" />
            สรุปรายงาน & กราฟสถิติ
          </button>
        </div>

        {/* แท็บที่ 1: จัดการชมรมทั้งหมด */}
        {activeTab === 'CLUBS' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleAddClub}
              className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4 h-fit"
            >
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#C81E6E]" />
                จัดตั้งชมรมใหม่
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อชมรม *</label>
                <input
                  type="text"
                  required
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  placeholder="เช่น ชมรมหุ่นยนต์และโดรน"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#C81E6E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">สังกัดฝ่าย (5 ฝ่าย)</label>
                <select
                  value={newClubCategory}
                  onChange={(e) => setNewClubCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  {CLUB_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">รายละเอียดชมรม</label>
                <textarea
                  rows={3}
                  value={newClubDescription}
                  onChange={(e) => setNewClubDescription(e.target.value)}
                  placeholder="คำอธิบายสั้นๆ เกี่ยวกับกิจกรรมของชมรม..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#C81E6E]"
                />
              </div>
              <button
                type="submit"
                disabled={submittingClub}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C81E6E] to-pink-600 disabled:opacity-60 text-white text-sm font-semibold shadow-md cursor-pointer"
              >
                {submittingClub ? 'กำลังบันทึก...' : 'เพิ่มชมรมเข้าสู่ระบบ'}
              </button>
            </form>

            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
              <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  รายชื่อชมรมทั้งหมด ({clubs.length} ชมรม)
                </span>
                <span className="text-[11px] text-slate-400">
                  คลิกที่ชื่อชมรมเพื่อดูประธาน อาจารย์ที่ปรึกษา และยอดสมาชิก
                </span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-sm text-slate-400">กำลังโหลดข้อมูลชมรม...</div>
              ) : clubs.length === 0 ? (
                <div className="p-10 text-center space-y-1">
                  <p className="text-sm font-bold text-slate-700">ยังไม่มีชมรมในฐานข้อมูล</p>
                  <p className="text-xs text-slate-400">กรอกฟอร์มด้านซ้ายเพื่อสร้างชมรมแรกได้เลย</p>
                </div>
              ) : (
                <div className="max-h-[580px] overflow-y-auto divide-y divide-slate-100">
                  {clubs.map((club) => {
                    const isExpanded = expandedClubId === club.id;
                    const leadership = getClubLeadership(club.id);

                    return (
                      <div key={club.id} className="transition">
                        <div className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80">
                          <button
                            type="button"
                            onClick={() => toggleExpandClub(club.id)}
                            className="min-w-0 flex-1 text-left flex items-start gap-3 cursor-pointer group"
                          >
                            <span
                              className={`mt-1 w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition ${
                                isExpanded
                                  ? 'bg-[#C81E6E] border-[#C81E6E] text-white'
                                  : 'bg-slate-100 border-slate-200 text-slate-500 group-hover:border-[#C81E6E] group-hover:text-[#C81E6E]'
                              }`}
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-[#C81E6E] transition">
                                  {club.name}
                                </p>
                                <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                  {club.highlight_badge || 'เปิดรับสมัคร'}
                                </span>
                              </div>
                              <p className="text-xs text-[#C81E6E] font-medium mt-0.5">
                                {club.category} • {club.faculty || 'ส่วนกลาง (ทุกคณะ)'}
                              </p>
                              {club.description && (
                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                  {club.description}
                                </p>
                              )}
                            </div>
                          </button>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => openEditClubModal(club)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition cursor-pointer"
                              title="แก้ไขข้อมูลชมรม"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              แก้ไข
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteClub(club)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition cursor-pointer"
                              title="ลบชมรม"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              ลบ
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-4 sm:px-6 pb-4 pt-1 bg-slate-50/90 border-t border-slate-100">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                              <div className="bg-white rounded-2xl border border-pink-100 p-3.5 flex items-start gap-3 shadow-2xs">
                                <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#C81E6E] flex items-center justify-center shrink-0">
                                  <Crown className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[11px] font-semibold text-slate-400">
                                    ประธานชมรม (President)
                                  </p>
                                  <p
                                    className={`text-xs sm:text-sm font-bold mt-0.5 truncate ${
                                      leadership.presidents.length > 0
                                        ? 'text-slate-900'
                                        : 'text-slate-400 italic font-normal'
                                    }`}
                                  >
                                    {leadership.presidentNames}
                                  </p>
                                </div>
                              </div>

                              <div className="bg-white rounded-2xl border border-indigo-100 p-3.5 flex items-start gap-3 shadow-2xs">
                                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                  <GraduationCap className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[11px] font-semibold text-slate-400">
                                    อาจารย์ที่ปรึกษา (Advisor)
                                  </p>
                                  <p
                                    className={`text-xs sm:text-sm font-bold mt-0.5 truncate ${
                                      leadership.advisors.length > 0
                                        ? 'text-slate-900'
                                        : 'text-slate-400 italic font-normal'
                                    }`}
                                  >
                                    {leadership.advisorNames}
                                  </p>
                                </div>
                              </div>

                              <div className="bg-white rounded-2xl border border-emerald-100 p-3.5 flex items-start gap-3 shadow-2xs">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                  <Users className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-[11px] font-semibold text-slate-400">
                                    สมาชิกทั้งหมดในชมรม
                                  </p>
                                  <p className="text-lg font-extrabold text-emerald-700 leading-tight mt-0.5">
                                    {Number(club.member_count || 0)}{' '}
                                    <span className="text-xs font-semibold text-slate-500">
                                      คน
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* แท็บที่ 2: จัดการยศผู้ใช้งาน (อัปเกรดค้นหา + ตัวกรองยศ/ชมรม + แบ่งหน้า) */}
        {activeTab === 'ROLES' && (
          <div className="space-y-4">
            {/* แถบปุ่มกรองตามยศอย่างรวดเร็ว */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'ALL', label: 'ทั้งหมด' },
                { key: 'STUDENT', label: 'นักศึกษา (STUDENT)' },
                { key: 'PRESIDENT', label: 'ประธานชมรม (PRESIDENT)' },
                { key: 'ADVISOR', label: 'อาจารย์ที่ปรึกษา (ADVISOR)' },
                { key: 'ADMIN', label: 'ผู้ดูแลระบบ (ADMIN)' },
              ].map((tab) => {
                const isActive = roleFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setRoleFilter(tab.key)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
                      isActive
                        ? 'bg-[#C81E6E] text-white border-[#C81E6E] shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-[#C81E6E] hover:text-[#C81E6E]'
                    }`}
                  >
                    {tab.label} ({roleCounts[tab.key]})
                  </button>
                );
              })}
            </div>

            {/* แถบค้นหา + ตัวกรองชมรม + ปุ่มล้างตัวกรอง */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {/* ช่องค้นหา */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="พิมพ์รหัสนักศึกษา, ชื่อ-นามสกุล, คณะ หรือชื่อชมรม..."
                  className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:outline-none focus:border-[#C81E6E]"
                />
                {searchUser && (
                  <button
                    type="button"
                    onClick={() => setSearchUser('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 cursor-pointer"
                    title="ล้างคำค้นหา"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* ตัวกรองตามชมรมที่ดูแล */}
              <div className="flex items-center gap-2 shrink-0">
                <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
                <select
                  value={clubFilter}
                  onChange={(e) => setClubFilter(e.target.value)}
                  className="w-full md:w-60 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 focus:bg-white focus:outline-none focus:border-[#C81E6E]"
                >
                  <option value="ALL">ทุกชมรม / ทุกสถานะ</option>
                  <option value="UNASSIGNED">ยังไม่สังกัดชมรม (-)</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      เฉพาะ: {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ปุ่มรีเซ็ตตัวกรอง */}
              {hasActiveUserFilters && (
                <button
                  type="button"
                  onClick={resetUserFilters}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  ล้างตัวกรอง
                </button>
              )}
            </div>

            {/* ตารางรายชื่อผู้ใช้งาน */}
            <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  พบทั้งหมด <strong className="text-slate-900">{filteredUsers.length}</strong> บัญชี
                  {hasActiveUserFilters ? ' (ตามเงื่อนไขที่กรอง)' : ''}
                </span>
                <span>
                  หน้า {safeUserPage} จาก {totalUserPages}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                      <th className="py-3.5 px-5">รหัส / อีเมล</th>
                      <th className="py-3.5 px-5">ชื่อ - นามสกุล</th>
                      <th className="py-3.5 px-5">คณะ / วิทยาลัย</th>
                      <th className="py-3.5 px-5">ตำแหน่ง (Role)</th>
                      <th className="py-3.5 px-5">ชมรมที่ดูแล</th>
                      <th className="py-3.5 px-5 text-right">จัดการสิทธิ์</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center space-y-2">
                          <p className="text-slate-500 font-semibold">
                            ไม่พบบัญชีผู้ใช้งานที่ตรงกับเงื่อนไขการค้นหา
                          </p>
                          {hasActiveUserFilters && (
                            <button
                              type="button"
                              onClick={resetUserFilters}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-pink-50 text-[#C81E6E] text-xs font-bold hover:bg-pink-100 cursor-pointer"
                            >
                              แสดงรายชื่อทั้งหมด
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-5">
                            <p className="font-bold text-slate-800">{user.student_id}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </td>
                          <td className="py-3.5 px-5 font-bold text-slate-900">{user.full_name}</td>
                          <td className="py-3.5 px-5 text-xs text-slate-600 max-w-[200px] truncate">
                            {user.faculty || '-'}
                          </td>
                          <td className="py-3.5 px-5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                user.role === 'ADMIN'
                                  ? 'bg-slate-900 text-white'
                                  : user.role === 'PRESIDENT'
                                  ? 'bg-pink-50 text-[#C81E6E]'
                                  : user.role === 'ADVISOR'
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-slate-600">
                            {user.role === 'ADMIN'
                              ? 'ทุกชมรมในระบบ'
                              : user.managed_club_name || '-'}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <button
                              onClick={() => openRoleModal(user)}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-[#C81E6E] text-white text-xs font-semibold transition cursor-pointer"
                            >
                              เปลี่ยนยศ / ผูกชมรม
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* แถบเปลี่ยนหน้า (Pagination) */}
              {filteredUsers.length > USERS_PER_PAGE && (
                <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    แสดงรายการที่ {(safeUserPage - 1) * USERS_PER_PAGE + 1} -{' '}
                    {Math.min(safeUserPage * USERS_PER_PAGE, filteredUsers.length)} จาก{' '}
                    {filteredUsers.length} บัญชี
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={safeUserPage <= 1}
                      onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-slate-400 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      ก่อนหน้า
                    </button>
                    <button
                      type="button"
                      disabled={safeUserPage >= totalUserPages}
                      onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-slate-400 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      ถัดไป
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* แท็บที่ 3: สรุปรายงาน & กราฟสถิติ */}
        {activeTab === 'REPORTS' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-[#C81E6E] uppercase tracking-wider">
                      Member Distribution Chart
                    </span>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      กราฟแท่งเปรียบเทียบจำนวนสมาชิกรายชมรม
                    </h2>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-pink-50 text-[#C81E6E] text-xs font-bold shrink-0">
                    รวม {totalMembersAllClubs} คน
                  </span>
                </div>

                {sortedClubsByMembers.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    ยังไม่มีข้อมูลชมรมสำหรับแสดงกราฟ
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-2">
                    <div className="min-w-[520px] h-64 flex items-end gap-3 pt-8 px-2 border-b border-slate-200">
                      {sortedClubsByMembers.map((club, index) => {
                        const count = Number(club.member_count || 0);
                        const heightPercent =
                          count === 0 ? 4 : Math.max(12, Math.round((count / maxMemberCount) * 100));

                        return (
                          <div
                            key={club.id}
                            className="flex-1 min-w-[64px] h-full flex flex-col items-center justify-end group"
                          >
                            <span className="text-xs font-extrabold text-slate-800 mb-1.5">
                              {count}
                            </span>
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className={`w-full max-w-[44px] rounded-t-xl transition-all duration-500 ${
                                count === 0
                                  ? 'bg-slate-200'
                                  : index === 0
                                  ? 'bg-gradient-to-t from-[#C81E6E] to-pink-500 shadow-md shadow-pink-500/20'
                                  : 'bg-gradient-to-t from-indigo-600 to-sky-500'
                              }`}
                              title={`${club.name}: ${count} คน`}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="min-w-[520px] flex items-start gap-3 pt-2.5 px-2">
                      {sortedClubsByMembers.map((club) => (
                        <div key={club.id} className="flex-1 min-w-[64px] text-center">
                          <p
                            className="text-[11px] font-semibold text-slate-600 line-clamp-2 leading-tight"
                            title={club.name}
                          >
                            {club.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-5">
                <div>
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                    Category Breakdown
                  </span>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    สถิติสมาชิกแยกตาม 5 ฝ่าย
                  </h2>
                </div>

                <div className="space-y-4">
                  {categoryStats.map((item) => {
                    const widthPercent =
                      item.memberCount === 0
                        ? 0
                        : Math.max(8, Math.round((item.memberCount / maxCategoryMembers) * 100));

                    return (
                      <div key={item.category} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 truncate pr-2">
                            {item.category}
                          </span>
                          <span className="font-extrabold text-slate-900 shrink-0">
                            {item.memberCount} คน{' '}
                            <span className="text-slate-400 font-normal">
                              ({item.clubCount} ชมรม)
                            </span>
                          </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            style={{ width: `${widthPercent}%` }}
                            className="h-full rounded-full bg-gradient-to-r from-[#C81E6E] to-indigo-600 transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#C81E6E] flex items-center justify-center">
                    <Table2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                      ตารางสรุปข้อมูลชมรม ผู้รับผิดชอบ และจำนวนสมาชิกทั้งหมด
                    </h2>
                    <p className="text-xs text-slate-500">
                      ข้อมูลอัปเดตแบบเรียลไทม์จากฐานข้อมูล TiDB Cloud
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                      <th className="py-3.5 px-4 text-center w-14">ลำดับ</th>
                      <th className="py-3.5 px-4">ชื่อชมรม</th>
                      <th className="py-3.5 px-4">สังกัดฝ่าย</th>
                      <th className="py-3.5 px-4">ประธานชมรม</th>
                      <th className="py-3.5 px-4">อาจารย์ที่ปรึกษา</th>
                      <th className="py-3.5 px-4 text-center">จำนวนสมาชิก</th>
                      <th className="py-3.5 px-4 text-center">กิจกรรม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {clubs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          ยังไม่มีข้อมูลชมรมในระบบ
                        </td>
                      </tr>
                    ) : (
                      clubs.map((club, index) => {
                        const info = getClubLeadership(club.id);
                        return (
                          <tr key={club.id} className="hover:bg-slate-50/70">
                            <td className="py-3.5 px-4 text-center font-semibold text-slate-500">
                              {index + 1}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">{club.name}</td>
                            <td className="py-3.5 px-4 text-xs text-slate-600">{club.category}</td>
                            <td className="py-3.5 px-4">
                              <span
                                className={
                                  info.presidents.length > 0
                                    ? 'font-semibold text-slate-800'
                                    : 'text-slate-400 italic text-xs'
                                }
                              >
                                {info.presidentNames}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={
                                  info.advisors.length > 0
                                    ? 'font-semibold text-slate-800'
                                    : 'text-slate-400 italic text-xs'
                                }
                              >
                                {info.advisorNames}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-xs">
                                {Number(club.member_count || 0)} คน
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                              {info.clubEventsCount} งาน
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {clubs.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-900 text-white text-xs sm:text-sm font-bold">
                        <td colSpan={5} className="py-3.5 px-4 text-right">
                          รวมทั้งหมด ({clubs.length} ชมรม)
                        </td>
                        <td className="py-3.5 px-4 text-center text-emerald-300">
                          {totalMembersAllClubs} คน
                        </td>
                        <td className="py-3.5 px-4 text-center text-pink-300">
                          {events.length} งาน
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL แก้ไขข้อมูลชมรม */}
      {editingClub && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateClub}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4"
          >
            <div>
              <span className="text-xs font-bold text-[#C81E6E] uppercase">Edit Club</span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                แก้ไขข้อมูลชมรม
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อชมรม *</label>
              <input
                type="text"
                required
                value={editClubName}
                onChange={(e) => setEditClubName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#C81E6E]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">สังกัดฝ่าย</label>
                <select
                  value={editClubCategory}
                  onChange={(e) => setEditClubCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  {CLUB_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ป้ายสถานะ (Badge)
                </label>
                <input
                  type="text"
                  value={editClubBadge}
                  onChange={(e) => setEditClubBadge(e.target.value)}
                  placeholder="เช่น เปิดรับสมัคร / ปิดรับสมัคร"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#C81E6E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">คณะ / สังกัด</label>
              <input
                type="text"
                value={editClubFaculty}
                onChange={(e) => setEditClubFaculty(e.target.value)}
                placeholder="ส่วนกลาง (ทุกคณะ)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#C81E6E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">รายละเอียดชมรม</label>
              <textarea
                rows={3}
                value={editClubDescription}
                onChange={(e) => setEditClubDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#C81E6E]"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingClub(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={savingClubEdit}
                className="flex-1 py-2.5 rounded-xl bg-[#C81E6E] hover:bg-[#a6175a] disabled:opacity-60 text-white text-sm font-semibold shadow-md cursor-pointer"
              >
                {savingClubEdit ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL แต่งตั้งยศและผูกชมรม */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveRole}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5"
          >
            <div>
              <span className="text-xs font-bold text-[#C81E6E] uppercase">Role Assignment</span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                กำหนดสิทธิ์ผู้ใช้งาน
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                บัญชี: <strong>{editingUser.full_name}</strong> ({editingUser.student_id})
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                เลือกตำแหน่ง (Role)
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-semibold"
              >
                <option value="STUDENT">STUDENT (นักศึกษาทั่วไป)</option>
                <option value="PRESIDENT">PRESIDENT (ประธานชมรม)</option>
                <option value="ADVISOR">ADVISOR (อาจารย์ที่ปรึกษา - Read Only)</option>
                <option value="ADMIN">ADMIN (ผู้ดูแลระบบสูงสุด)</option>
              </select>
            </div>

            {(selectedRole === 'PRESIDENT' || selectedRole === 'ADVISOR') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  เลือกชมรมที่รับผิดชอบ
                </label>
                {clubs.length === 0 ? (
                  <p className="text-xs text-red-500">
                    ยังไม่มีชมรมในระบบ กรุณาเพิ่มชมรมก่อนผูกตำแหน่ง
                  </p>
                ) : (
                  <select
                    value={selectedClubId}
                    onChange={(e) => setSelectedClubId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.category})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#C81E6E] hover:bg-[#a6175a] text-white text-sm font-semibold shadow-md cursor-pointer"
              >
                บันทึกสิทธิ์
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}