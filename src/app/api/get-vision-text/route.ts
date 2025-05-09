import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const getDbConnection = async () => {
  return await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "123456",
    database: "Agentic_AI_Interviewer",
  });
};


export async function GET(req: NextRequest) {
  try {
    const conn = await getDbConnection();
    
    // Fetch the latest vision analysis text
    const [rows] = await conn.execute("SELECT analysis FROM vision_analysis ORDER BY created_at DESC LIMIT 1");
    await conn.end();

    if (Array.isArray(rows) && rows.length > 0) {
      return NextResponse.json({ visionText: rows[0] });
    } else {
      return NextResponse.json({ visionText: "No vision data available." });
    }
  } catch (error) {
    console.error(" Error fetching vision text:", error);
    return NextResponse.json({ error: "Failed to fetch vision data." }, { status: 500 });
  }
}
