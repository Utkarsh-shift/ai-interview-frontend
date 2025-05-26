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
  let conn;
  try {
    const body = await req.json();

    const {openai_session_id, batch_id } = body;
    console.log("Received data:", { openai_session_id, batch_id });
    if (!openai_session_id || !batch_id) {
      console.error(" Missing fields:", {openai_session_id ,batch_id});
      return NextResponse.json({ error: "Missing openai_session_id or batch id" }, { status: 400 });
    }

    conn = await pool.getConnection();

    const [result] = await conn.execute(
      `INSERT INTO lipsync_openaiid_batchid (openai_session_id , batch_id,created_at,updated_at)
       VALUES (?, ?,NOW(), NOW())
       ON DUPLICATE KEY UPDATE openai_session_id = VALUES(openai_session_id)`,
      [openai_session_id , batch_id]
    );

    return NextResponse.json({ message: "Session stored or updated.", result }, { status: 201 });

  } catch (err) {
    console.error("Failed to save session:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    if (conn) await conn.release();
  }
}
