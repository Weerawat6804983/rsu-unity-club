import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        users.id,
        users.student_id,
        users.full_name,
        users.email,
        users.faculty,
        users.role,
        users.managed_club_id,
        clubs.name AS managed_club_name
      FROM users
      LEFT JOIN clubs ON users.managed_club_id = clubs.id
      ORDER BY users.id DESC
    `);
    return NextResponse.json({ success: true, users: rows });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'ดึงข้อมูลผู้ใช้งานไม่สำเร็จ', error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { userId, role, managed_club_id } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { success: false, message: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      );
    }

    const clubIdValue =
      role === 'PRESIDENT' || role === 'ADVISOR'
        ? managed_club_id
          ? Number(managed_club_id)
          : null
        : null;

    await pool.query(
      'UPDATE users SET role = ?, managed_club_id = ? WHERE id = ?',
      [role, clubIdValue, Number(userId)]
    );

    return NextResponse.json({
      success: true,
      message: 'อัปเดตสิทธิ์และชมรมเรียบร้อยแล้ว',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'อัปเดตสิทธิ์ไม่สำเร็จ', error: error.message },
      { status: 500 }
    );
  }
}