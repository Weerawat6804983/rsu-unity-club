import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, full_name, faculty, currentPassword, newPassword } = body;

    if (!id || !full_name || !faculty) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกชื่อ-นามสกุล และเลือกคณะให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [Number(id)]);
    const user = rows[0];

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลบัญชีผู้ใช้งาน' },
        { status: 404 }
      );
    }

    // ตรวจสอบชื่อคอลัมน์รหัสผ่านในตาราง users (รองรับทั้ง password และ password_hash)
    const passwordCol =
      Object.prototype.hasOwnProperty.call(user, 'password_hash')
        ? 'password_hash'
        : 'password';

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, message: 'กรุณากรอกรหัสผ่านปัจจุบันก่อนเปลี่ยนรหัสผ่านใหม่' },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' },
          { status: 400 }
        );
      }

      const isMatch = await bcrypt.compare(currentPassword, user[passwordCol] || '');
      if (!isMatch) {
        return NextResponse.json(
          { success: false, message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' },
          { status: 401 }
        );
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await pool.query(
        `UPDATE users SET full_name = ?, faculty = ?, ${passwordCol} = ? WHERE id = ?`,
        [full_name.trim(), faculty, hashedNewPassword, Number(id)]
      );
    } else {
      await pool.query('UPDATE users SET full_name = ?, faculty = ? WHERE id = ?', [
        full_name.trim(),
        faculty,
        Number(id),
      ]);
    }

    return NextResponse.json({
      success: true,
      message: 'บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'บันทึกข้อมูลไม่สำเร็จ', error: error.message },
      { status: 500 }
    );
  }
}