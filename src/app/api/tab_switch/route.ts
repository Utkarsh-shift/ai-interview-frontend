// /api/tab_switch/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import mysql from "mysql2/promise";

// const pool = mysql.createPool({
//   host: "localhost",
//   user: "root",
//   password: "123456",
//   database: "InterviewAgent",
//   waitForConnections: true,
//   connectionLimit: 100,
//   queueLimit: 0,
// });

// const getDbConnection = async () => {
//   return await pool.getConnection();
// };

// export async function OPTIONS() {
//   return NextResponse.json({}, {
//     status: 200,
//     headers: {
//       "Access-Control-Allow-Origin": "*",
//       "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
//       "Access-Control-Allow-Headers": "Content-Type",
//     },
//   });
// }

// export async function POST(req: NextRequest) {
//   let conn;
//   try {
//     const body = await req.json();
//     let { session_id, image_data, tabevent, tab_count = 0, fullscreen_exit_count = 0 } = body;
//     const image = image_data;

//     if (Array.isArray(session_id)) {
//       session_id = session_id.find(id => id.includes("sess_")) || session_id[0];
//     }

//     if (typeof session_id !== "string" || !session_id.includes("sess_")) {
//       console.error("Invalid session_id received:", session_id);
//       return NextResponse.json({ error: "Invalid session_id format." }, { status: 400 });
//     }

//     conn = await getDbConnection();

//     await conn.execute(
//       "INSERT INTO tabswitch_data (session_id, image_data, updated_at, tabevent, tabswitch_count, fullscreen_exit_count) VALUES (?, ?, NOW(), ?, ?, ?)",
//       [session_id, image, tabevent, tab_count, fullscreen_exit_count]
//     );

//     return NextResponse.json({ message: "Data stored successfully.", tab_count, fullscreen_exit_count }, { status: 201 });

//   } catch (error) {
//     console.error("Error storing data:", error);
//     return NextResponse.json({ error: "Database error." }, { status: 500 });
//   } finally {
//     if (conn) {
//       await conn.release();
//     }
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "Agentic_AI_Interviewer",
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0,
});

const getDbConnection = async () => {
  return await pool.getConnection();
};

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: NextRequest) {
  let conn;
  try {
    const body = await req.json();
    let { session_id, image_data, tabevent, tab_count = 0, fullscreen_exit_count = 0 } = body;
    const image = image_data;

    if (Array.isArray(session_id)) {
      session_id = session_id.find(id => id.includes("sess_")) || session_id[0];
    }

    if (typeof session_id !== "string" || !session_id.includes("sess_")) {
      console.error("Invalid session_id received:", session_id);
      return NextResponse.json({ error: "Invalid session_id format." }, { status: 400 });
    }

    conn = await getDbConnection();

    await conn.execute(
      "INSERT INTO tabswitch_data (session_id, image_data, tabevent, tabswitch_count, fullscreen_exit_count, created_at , updated_at) VALUES (?, ?, ?, ?, ?,NOW(),NOW())",
      [session_id, image, tabevent, tab_count, fullscreen_exit_count]
    );

    return NextResponse.json({ message: "Data stored successfully.", tab_count, fullscreen_exit_count }, { status: 201 });

  } catch (error) {
    console.error("Error storing data:", error);
    return NextResponse.json({ error: "Database error." }, { status: 500 });
  } finally {
    if (conn) {
      await conn.release();
    }
  }
}
