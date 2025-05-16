

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

const extractSessionId = (transcriptItems: any[]): string | null => {
  const sessionItem = transcriptItems.find(
    (item) => item.type === "BREADCRUMB" && item.title.includes("session.id:")
  );
  return sessionItem ? sessionItem.title.split("session.id: ")[1].split("\n")[0].trim() : null;
};

const extractAgent = (transcriptItems: any[]): string | null => {
  const agentItem = transcriptItems.find(
    (item) => item.type === "BREADCRUMB" && item.title.includes("Agent:")
  );
  return agentItem ? agentItem.title.replace("Agent: ", "").trim() : null;
};

const storeInterviewData = async (transcriptItems: any[]) => {
  if (!transcriptItems || transcriptItems.length === 0) {
    console.error("❌ Error: No items found in the data.");
    return;
  }

  const conn = await pool.getConnection();
  try {
    const sessionId = extractSessionId(transcriptItems) || "UNKNOWN";
    const agentName = extractAgent(transcriptItems) || "UNKNOWN";

    // Sort by timestamp/createdAtMs
    transcriptItems.sort((a, b) => {
      const timeA = a.timestamp || a.createdAtMs || 0;
      const timeB = b.timestamp || b.createdAtMs || 0;
      return timeA - timeB;
    });

    const sql = `
      INSERT INTO interview_transcripts 
      (itemId, session_id, type, role, title, timestamp, createdAtMs, status, isHidden, Vision_Analysis, Agent, created_at, updated_at) 
      VALUES ?
    `;

    const values: any[] = [];

    for (const item of transcriptItems) {
      if (!item?.itemId || !item?.type || item.role === undefined) {
        if (item.type !== "BREADCRUMB") {
          console.warn("⚠️ Skipping invalid transcript item:", item);
        }
        continue;
      }

      let titleText = item.title?.trim() || "";
      let visionAnalysis = "";

      if (item.role === "user") {
        if (titleText.includes("$$")) {
          const [main, vision] = titleText.split("$$");
          titleText = main.trim();
          visionAnalysis = vision.trim();
        } else if (titleText.includes("##@@##")) {
          const [main, vision] = titleText.split("##@@##");
          titleText = main.trim();
          visionAnalysis = vision.trim();
        }
      } else if (item.role === "assistant") {
        visionAnalysis = "No analysis from assistant type";
      }

      const messageTimestamp = item.timestamp || item.createdAtMs || Date.now();

      values.push([
        item.itemId,
        sessionId,
        item.type,
        item.role,
        titleText,
        messageTimestamp,
        item.createdAtMs || null,
        item.status || "PENDING",
        item.isHidden || false,
        visionAnalysis,
        agentName,
        new Date(),
        new Date(),
      ]);
    }

    if (values.length > 0) {
      await conn.query(sql, [values]);
    }

    await storeInterviewEvaluation(sessionId, conn);
  } catch (error) {
    console.error("❌ Database Error (storeInterviewData):", error);
  } finally {
    conn.release();
  }
};

const storeInterviewEvaluation = async (sessionId: string, conn: mysql.PoolConnection) => {
  try {
    const [rows] = await conn.execute(
      "SELECT id FROM interview_evaluations WHERE session_id = ?",
      [sessionId]
    );

    if ((rows as any[]).length > 0) {
      console.log(`⚠️ Evaluation already exists for session_id: ${sessionId}. Skipping.`);
    } else {
      const insertEvalSql = `
        INSERT INTO interview_evaluations 
        (session_id, evaluation_text, performance_score, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `;
      await conn.execute(insertEvalSql, [sessionId, "Evaluation pending...", 0, "PENDING"]);
    }
  } catch (error) {
    console.error("❌ Database Error (storeInterviewEvaluation):", error);
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.transcriptItems) {
      console.error("❌ Missing transcriptItems in the request body");
      return NextResponse.json({ error: "Missing transcriptItems" }, { status: 400 });
    }

    await storeInterviewData(body.transcriptItems);

    return NextResponse.json({ success: "Data received successfully" });
  } catch (error) {
    console.error("❌ Error in POST handler:", error);
    return NextResponse.json({ error: "Failed to process the request" }, { status: 500 });
  }
}
