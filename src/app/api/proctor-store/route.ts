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

    
    const { openai_session_id, image, count, cell_phone_detected } = body;

    

    if (!openai_session_id || typeof openai_session_id !== "string" || !openai_session_id.startsWith("")) {
      console.warn("⚠️ Missing or Invalid openai_session_id:", openai_session_id);
      return NextResponse.json({ error: "Missing or Invalid openai_session_id" }, { status: 400 });
    }

    
    if (!image || typeof image !== "string" || image.length < 100) {
      console.error("⚠️ Invalid or empty image data");
      return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
    }

    // Validate count
    if (typeof count !== "number") {
      console.error("⚠️ Invalid count:", count);
      return NextResponse.json({ error: "Invalid count" }, { status: 400 });
    }

    // Insert into the database with only the openai_session_id
    conn = await pool.getConnection();
    await conn.execute(
      `INSERT INTO detected_images 
       (openai_session_id, image_data, person_count, cell_phone_detected,  created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [openai_session_id, image, count, cell_phone_detected]
    );
    
    return NextResponse.json({ message: "Data stored successfully." }, { status: 201 });

  } catch (error) {
    console.error(" Error storing data:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    if (conn) await conn.release();
  }
}
