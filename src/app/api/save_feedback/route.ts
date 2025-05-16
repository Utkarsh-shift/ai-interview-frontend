import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

import { config } from 'dotenv';
config();


const pool = mysql.createPool({
host: process.env.MYSQL_HOST,
user: process.env.MYSQL_USER,
password: process.env.MYSQL_PASSWORD,
database: process.env.MYSQL_DATABASE,
port: Number(process.env.MYSQL_PORT) || 3306,
waitForConnections: true,
});

export async function POST(req: NextRequest) {
  const conn = await pool.getConnection();
  try {
    const { feedback, rating, openai_session_id } = await req.json();

    if (!feedback || !rating || !openai_session_id) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    await conn.execute(
      "INSERT INTO user_feedback (openai_session_id, feedback, rating, created_at,updated_at) VALUES (?, ?, ?, NOW(),NOW())",
      [openai_session_id, feedback, rating]
    );

    return NextResponse.json({ message: "Feedback saved successfully" }, { status: 201 });
  } catch (err) {
    console.error("❌ Error storing feedback:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  } finally {
    conn.release();
  }
}
