import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('club_id');

    let query = `
      SELECT events.*, clubs.name AS club_name , clubs.category AS club_category
      FROM events
      LEFT JOIN clubs ON events.club_id = clubs.id
    `;
    const params = [];

    if (clubId) {
      query += ' WHERE events.club_id = ?';
      params.push(Number(clubId));
    }

    query += ' ORDER BY events.id DESC';

    const [rows] = await pool.query(query, params);
    return NextResponse.json({ success: true, events: rows });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'ดึงข้อมูลกิจกรรมไม่สำเร็จ', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      club_id,
      title,
      description,
      event_date,
      event_time,
      location,
      hours,
      image_url,
      registration_url,
    } = body;

    if (!club_id || !title || !event_date || !location) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลกิจกรรมให้ครบ (ชมรม, ชื่อกิจกรรม, วันที่, สถานที่)' },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      `INSERT INTO events (club_id, title, description, event_date, event_time, location, hours, image_url, registration_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(club_id),
        title,
        description || '',
        event_date,
        event_time || '16:30 - 19:00 น.',
        location,
        hours || '+3 ชม. กิจกรรม',
        image_url || '',
        registration_url || '',
      ]
    );

    return NextResponse.json(
      { success: true, message: 'สร้างกิจกรรมใหม่สำเร็จ!', eventId: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'สร้างกิจกรรมไม่สำเร็จ', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      description,
      event_date,
      event_time,
      location,
      hours,
      image_url,
      registration_url,
    } = body;

    if (!id || !title || !event_date || !location) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน' },
        { status: 400 }
      );
    }

    await pool.query(
      `UPDATE events
       SET title = ?, description = ?, event_date = ?, event_time = ?, location = ?, hours = ?, image_url = ?, registration_url = ?
       WHERE id = ?`,
      [
        title,
        description || '',
        event_date,
        event_time || '16:30 - 19:00 น.',
        location,
        hours || '+3 ชม. กิจกรรม',
        image_url || '',
        registration_url || '',
        Number(id),
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'บันทึกการแก้ไขกิจกรรมเรียบร้อยแล้ว',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'แก้ไขกิจกรรมไม่สำเร็จ', error: error.message },
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
        { success: false, message: 'ไม่พบรหัสกิจกรรมที่ต้องการลบ' },
        { status: 400 }
      );
    }

    await pool.query('DELETE FROM events WHERE id = ?', [Number(id)]);

    return NextResponse.json({
      success: true,
      message: 'ลบกิจกรรมเรียบร้อยแล้ว',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'ลบกิจกรรมไม่สำเร็จ', error: error.message },
      { status: 500 }
    );
  }
}