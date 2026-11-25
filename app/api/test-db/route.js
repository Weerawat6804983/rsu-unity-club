import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query('SHOW TABLES');
    return NextResponse.json({
      success: true,
      message: 'เชื่อมต่อ TiDB Cloud สำเร็จ!',
      tables: rows,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'เชื่อมต่อฐานข้อมูลไม่สำเร็จ',
        error: error.message,
      },
      { status: 500 }
    );
  }
}