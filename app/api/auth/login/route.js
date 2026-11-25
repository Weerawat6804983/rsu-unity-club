import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const loginId = body.email || body.student_id || body.identifier;
    const { password } = body;

    if (!loginId || !password) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกอีเมล/รหัสนักศึกษา และรหัสผ่าน' },
        { status: 400 }
      );
    }

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR student_id = ? LIMIT 1',
      [loginId, loginId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ' },
        { status: 401 }
      );
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'รหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    const userPayload = {
      id: user.id,
      student_id: user.student_id,
      full_name: user.full_name,
      email: user.email,
      faculty: user.faculty,
      role: user.role,
      managed_club_id: user.managed_club_id,
    };

    await createSession(userPayload);

    return NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      user: userPayload,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ', error: error.message },
      { status: 500 }
    );
  }
}