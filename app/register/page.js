'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Hash,
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
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
];

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    studentId: '',
    fullName: '',
    faculty: '',
    email: '',
    password: '',
    confirmPassword: '',
    contact: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.studentId || !formData.fullName || !formData.faculty || !formData.email || !formData.password) {
      setError('กรุณากรอกข้อมูลในช่องที่มีเครื่องหมาย * ให้ครบถ้วน');
      return;
    }

    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: formData.studentId.trim(),
          full_name: formData.fullName.trim(),
          faculty: formData.faculty,
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        setLoading(false);
        return;
      }

      setSuccess('สมัครสมาชิกสำเร็จ! บันทึกข้อมูลลงระบบเรียบร้อย กำลังไปหน้าเข้าสู่ระบบ...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50/40 to-purple-50/50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#C81E6E] mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหน้าหลัก (RSU Unity Club)
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#C81E6E] to-[#9b1554] flex items-center justify-center text-white font-bold text-lg shadow-sm">
            RSU
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">สมัครสมาชิกใหม่</h1>
            <p className="text-xs text-slate-500">สร้างบัญชีนักศึกษาเพื่อสมัครเข้าชมรมและติดตามกิจกรรม</p>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-sm rounded-3xl border border-slate-200/90">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs sm:text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs sm:text-sm text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* แถว 1: รหัสนักศึกษา + ชื่อ-นามสกุล */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  รหัสนักศึกษา <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    placeholder="เช่น 6601234"
                    maxLength={10}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C81E6E]/30 focus:border-[#C81E6E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="ชื่อ - นามสกุล"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C81E6E]/30 focus:border-[#C81E6E]"
                  />
                </div>
              </div>
            </div>

            {/* คณะ / วิทยาลัย */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                คณะ / วิทยาลัย <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#C81E6E]/30 focus:border-[#C81E6E]"
                >
                  <option value="">-- เลือกคณะ / วิทยาลัย --</option>
                  {RSU_FACULTIES.map((fac) => (
                    <option key={fac} value={fac}>
                      {fac}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* อีเมล */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                อีเมล (ใช้สำหรับเข้าสู่ระบบ) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student.66@rsu.ac.th"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C81E6E]/30 focus:border-[#C81E6E]"
                />
              </div>
            </div>

            {/* รหัสผ่าน + ยืนยันรหัสผ่าน */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  รหัสผ่าน (ขั้นต่ำ 6 ตัว) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••"
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C81E6E]/30 focus:border-[#C81E6E]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C81E6E]/30 focus:border-[#C81E6E]"
                  />
                </div>
              </div>
            </div>

            {/* ช่องทางติดต่อ (ไม่บังคับ) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                LINE ID หรือเบอร์ติดต่อ <span className="text-slate-400 font-normal">(ไม่บังคับ — เผื่อประธานชมรมดึงเข้ากลุ่ม)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="LINE ID หรือเบอร์โทรศัพท์"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C81E6E]/30 focus:border-[#C81E6E]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#C81E6E] hover:bg-[#a6175a] disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition cursor-pointer mt-2"
            >
              {loading ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชีนักศึกษา (Create Account)'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs sm:text-sm text-slate-600">
            มีบัญชีอยู่แล้ว?{' '}
            <Link href="/login" className="font-semibold text-[#C81E6E] hover:underline">
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}