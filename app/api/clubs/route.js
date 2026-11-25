import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT clubs.*, COALESCE(app_counts.member_count, 0) AS member_count
      FROM clubs
      LEFT JOIN (
        SELECT club_id, COUNT(*) AS member_count
        FROM applications
        WHERE status = 'APPROVED'
        GROUP BY club_id
      ) AS app_counts ON clubs.id = app_counts.club_id
      ORDER BY clubs.id DESC
    `);
    return NextResponse.json({ success: true, clubs: rows });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'ดึงข้อมูลชมรมไม่สำเร็จ', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, category, faculty, description, approval_mode, highlight_badge } = body;

    if (!name || !category) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกชื่อชมรมและหมวดหมู่' },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      `INSERT INTO clubs (name, category, faculty, description, approval_mode, highlight_badge)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        category,
        faculty || 'ส่วนกลาง (ทุกคณะ)',
        description || '',
        approval_mode === 'MANUAL' ? 'MANUAL' : 'AUTO',
        highlight_badge || 'เปิดรับสมัคร',
      ]
    );

    return NextResponse.json(
      { success: true, message: 'เพิ่มชมรมใหม่สำเร็จ!', clubId: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'เพิ่มชมรมไม่สำเร็จ', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, category, faculty, description, highlight_badge } = body;

    if (!id || !name || !category) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุข้อมูลชมรมให้ครบถ้วน' },
        { status: 400 }
      );
    }

    await pool.query(
      `UPDATE clubs 
       SET name = ?, category = ?, faculty = ?, description = ?, highlight_badge = ?
       WHERE id = ?`,
      [
        name.trim(),
        category,
        faculty || 'ส่วนกลาง (ทุกคณะ)',
        description || '',
        highlight_badge || 'เปิดรับสมัคร',
        Number(id),
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'แก้ไขข้อมูลชมรมเรียบร้อยแล้ว',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'แก้ไขข้อมูลชมรมไม่สำเร็จ', error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, approval_mode } = body;

    if (!id || !['MANUAL', 'AUTO'].includes(approval_mode)) {
      return NextResponse.json(
        { success: false, message: 'ข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    await pool.query('UPDATE clubs SET approval_mode = ? WHERE id = ?', [
      approval_mode,
      Number(id),
    ]);

    return NextResponse.json({
      success: true,
      message: 'อัปเดตโหมดการอนุมัติเรียบร้อยแล้ว',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'อัปเดตโหมดไม่สำเร็จ', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบรหัสชมรมที่ต้องการลบ' },
        { status: 400 }
      );
    }

    const clubId = Number(id);

    // ปลดการผูกชมรมของประธาน/อาจารย์ และลบใบสมัคร/กิจกรรมที่สังกัดชมรมนี้ก่อน เพื่อไม่ให้ติด Foreign Key
    await pool.query('UPDATE users SET managed_club_id = NULL WHERE managed_club_id = ?', [clubId]);
    await pool.query('DELETE FROM applications WHERE club_id = ?', [clubId]);
    await pool.query('DELETE FROM events WHERE club_id = ?', [clubId]);
    await pool.query('DELETE FROM clubs WHERE id = ?', [clubId]);

    return NextResponse.json({
      success: true,
      message: 'ลบชมรมออกจากระบบเรียบร้อยแล้ว',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'ลบชมรมไม่สำเร็จ', error: error.message },
      { status: 500 }
    );
  }
}