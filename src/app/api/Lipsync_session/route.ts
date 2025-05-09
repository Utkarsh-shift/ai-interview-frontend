import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "Agentic_AI_Interviewer",
  waitForConnections: true,
});

export async function POST(req: NextRequest) {
  let conn;
  try {
    const body = await req.json();

    const { sessionId, openai_session_id, batch_id } = body;
    console.log("Received data:", { sessionId, openai_session_id, batch_id });
    if (!sessionId || !openai_session_id || !batch_id) {
      console.error(" Missing fields:", { sessionId, openai_session_id ,batch_id});
      return NextResponse.json({ error: "Missing sessionId or openai_session_id" }, { status: 400 });
    }

    conn = await pool.getConnection();

    const [result] = await conn.execute(
      `INSERT INTO lipsync_openaiid_batchid (lipsync_session_id,  openai_session_id , batch_id,created_at,updated_at)
       VALUES (?,  ?, ?,NOW(), NOW())
       ON DUPLICATE KEY UPDATE openai_session_id = VALUES(openai_session_id)`,
      [sessionId, openai_session_id , batch_id]
    );

    return NextResponse.json({ message: "Session stored or updated.", result }, { status: 201 });

  } catch (err) {
    console.error("Failed to save session:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    if (conn) await conn.release();
  }
}
