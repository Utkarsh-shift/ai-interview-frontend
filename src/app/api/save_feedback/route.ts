import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "Agentic_AI_Interviewer",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
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
