import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { student_id, full_name, email, password, faculty } = body;

    if (!student_id || !full_name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR student_id = ?',
      [email, student_id]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: 'รหัสนักศึกษาหรืออีเมลนี้ถูกใช้งานแล้ว' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (student_id, full_name, email, password_hash, faculty, role)
       VALUES (?, ?, ?, ?, ?, 'STUDENT')`,
      [student_id, full_name, email, passwordHash, faculty || 'ไม่ระบุคณะ']
    );

    return NextResponse.json(
      {
        success: true,
        message: 'สมัครสมาชิกสำเร็จ!',
        userId: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก', error: error.message },
      { status: 500 }
    );
  }
}