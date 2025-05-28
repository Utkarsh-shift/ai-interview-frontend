// import { NextRequest, NextResponse } from "next/server";
// import mysql from "mysql2/promise";
// import { config } from 'dotenv';
// config();


// const pool = mysql.createPool({
// host: process.env.MYSQL_HOST,
// user: process.env.MYSQL_USER,
// password: process.env.MYSQL_PASSWORD,
// database: process.env.MYSQL_DATABASE,
// port: Number(process.env.MYSQL_PORT) || 3306,
// waitForConnections: true,
// });


// export async function POST(req: NextRequest) {
//   let conn;
//   try {
//     const body = await req.json();

//     const {openai_session_id, batch_id } = body;
//     console.log("Received data:", { openai_session_id, batch_id });
//     if (!openai_session_id || !batch_id) {
//       console.error(" Missing fields:", {openai_session_id ,batch_id});
//       return NextResponse.json({ error: "Missing openai_session_id or batch id" }, { status: 400 });
//     }

//     conn = await pool.getConnection();

//     const [result] = await conn.execute(
//       `INSERT INTO lipsync_openaiid_batchid (openai_session_id , batch_id,created_at,updated_at)
//        VALUES (?, ?,NOW(), NOW())
//        ON DUPLICATE KEY UPDATE openai_session_id = VALUES(openai_session_id)`,
//       [openai_session_id , batch_id]
//     );

//     return NextResponse.json({ message: "Session stored or updated.", result }, { status: 201 });

//   } catch (err) {
//     console.error("Failed to save session:", err);
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   } finally {
//     if (conn) await conn.release();
//   }
// }





import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: Number(process.env.MYSQL_PORT) || 3306,
  waitForConnections: true,
});



function toMySQLDatetime(isoString: string): string {
  const date = new Date(isoString);
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  const ms = String(date.getMilliseconds()).padStart(3, "0");
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}.${ms}000`;
}

export async function POST(req: NextRequest) {
  let conn;
  try {
    const body = await req.json();
    const { openai_session_id, batch_id, started_at, ended_at, job_id } = body;

    if (!openai_session_id) {
      return NextResponse.json({ error: "Missing openai_session_id" }, { status: 400 });
    }

    conn = await pool.getConnection();

    const [rows] = await conn.execute(
      `SELECT ended_at FROM lipsync_openaiid_batchid WHERE openai_session_id = ?`,
      [openai_session_id]
    );
    const session = Array.isArray(rows) ? rows[0] : null;

    // Case 1: Create entry if batch_id and job_id provided
    if (batch_id && job_id && !started_at && !ended_at) {
      const defaultStatus = session?.ended_at ? "Session Expired" : "Session Pending";

      await conn.execute(
        `INSERT INTO lipsync_openaiid_batchid (openai_session_id, batch_id, job_id, created_at, updated_at, Status)
         VALUES (?, ?, ?, NOW(), NOW(), ?)
         ON DUPLICATE KEY UPDATE updated_at = NOW()`,
        [openai_session_id, batch_id, job_id, defaultStatus]
      );

      return NextResponse.json({ message: "Session inserted" }, { status: 201 });
    }

    // Case 2: Update started_at
    if (started_at) {
      const mysqlStartedAt = toMySQLDatetime(started_at);
      await conn.execute(
        `UPDATE lipsync_openaiid_batchid SET started_at = ?, updated_at = NOW() WHERE openai_session_id = ?`,
        [mysqlStartedAt, openai_session_id]
      );
      return NextResponse.json({ message: "Started time updated" }, { status: 200 });
    }

    // Case 3: Update ended_at and Status = Session Expired
    if (ended_at) {
      const mysqlEndedAt = toMySQLDatetime(ended_at);
      await conn.execute(
        `UPDATE lipsync_openaiid_batchid 
         SET ended_at = ?, Status = "Session Expired", updated_at = NOW() 
         WHERE openai_session_id = ?`,
        [mysqlEndedAt, openai_session_id]
      );
      return NextResponse.json({ message: "Ended time and status updated" }, { status: 200 });
    }

    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    if (conn) await conn.release();
  }
}
