import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('club_id');
    const userId = searchParams.get('user_id');

    let query = `
      SELECT 
        applications.*,
        users.student_id,
        users.full_name,
        users.email,
        users.faculty,
        clubs.name AS club_name,
        clubs.category AS club_category,
        clubs.faculty AS club_faculty
      FROM applications
      JOIN users ON applications.user_id = users.id
      JOIN clubs ON applications.club_id = clubs.id
    `;
    const conditions = [];
    const params = [];

    if (clubId) {
      conditions.push('applications.club_id = ?');
      params.push(Number(clubId));
    }
    if (userId) {
      conditions.push('applications.user_id = ?');
      params.push(Number(userId));
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY applications.applied_at DESC';

    const [rows] = await pool.query(query, params);
    return NextResponse.json({ success: true, applications: rows });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'ดึงข้อมูลใบสมัครไม่สำเร็จ', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, club_id, contact, reason } = body;

    if (!user_id || !club_id || !contact) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลการสมัครให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const [existing] = await pool.query(
      `SELECT id FROM applications WHERE user_id = ? AND club_id = ? AND status IN ('PENDING', 'APPROVED')`,
      [Number(user_id), Number(club_id)]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: 'คุณได้สมัครหรือเป็นสมาชิกชมรมนี้อยู่แล้ว' },
        { status: 409 }
      );
    }

    const [clubRows] = await pool.query('SELECT approval_mode FROM clubs WHERE id = ?', [
      Number(club_id),
    ]);
    const isAuto = clubRows[0]?.approval_mode === 'AUTO';
    const initialStatus = isAuto ? 'APPROVED' : 'PENDING';

    const [result] = await pool.query(
      `INSERT INTO applications (user_id, club_id, contact, reason, status)
       VALUES (?, ?, ?, ?, ?)`,
      [Number(user_id), Number(club_id), contact, reason || '', initialStatus]
    );

    return NextResponse.json(
      {
        success: true,
        status: initialStatus,
        message: isAuto
          ? 'สมัครเข้าชมรมสำเร็จ (อนุมัติอัตโนมัติทันที!)'
          : 'ส่งใบสมัครเรียบร้อยแล้ว รอประธานชมรมพิจารณา',
        applicationId: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'ส่งใบสมัครไม่สำเร็จ', error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'ข้อมูลสถานะไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    await pool.query('UPDATE applications SET status = ? WHERE id = ?', [status, Number(id)]);

    return NextResponse.json({
      success: true,
      message: status === 'APPROVED' ? 'อนุมัติเข้าชมรมเรียบร้อยแล้ว' : 'อัปเดตสถานะเรียบร้อยแล้ว',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'อัปเดตสถานะใบสมัครไม่สำเร็จ', error: error.message },
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
        { success: false, message: 'ไม่พบรหัสใบสมัครที่ต้องการยกเลิก' },
        { status: 400 }
      );
    }

    await pool.query('DELETE FROM applications WHERE id = ?', [Number(id)]);

    return NextResponse.json({
      success: true,
      message: 'ยกเลิกใบสมัครเรียบร้อยแล้ว',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'ยกเลิกใบสมัครไม่สำเร็จ', error: error.message },
      { status: 500 }
    );
  }
}