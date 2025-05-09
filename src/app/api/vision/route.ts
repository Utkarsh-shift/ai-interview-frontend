import { NextRequest, NextResponse } from "next/server";
import mysql from 'mysql2/promise';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const getDbConnection = async () => {
  return await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "123456",
    database: "Agentic_AI_Interviewer"
  });
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const base64Data = body.base64Frame;

    if (!base64Data) {
      console.warn("Missing or invalid frames.");
      return NextResponse.json({ error: "Missing or invalid frames." }, { status: 400 });
    }

    
    const base64Size = Buffer.byteLength(base64Data, 'base64');
    

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `describe the image `
        },
        {
          role: "user",
          content: [
            { type: "text", text: `see what is in the image` },

              {
                    type: "image_url",
                    image_url: { url: `${base64Data}`, detail: "auto" }

                 
                }
          ]

        }
      ],
      max_tokens: 64,
    });

    const analysisResult = response.choices[0].message.content;
    
    const conn = await getDbConnection();
    await conn.execute(
      "INSERT INTO vision_analysis (analysis) VALUES (?)",
      [JSON.stringify({ time: new Date().toISOString(), analysis: analysisResult })]
    );
    await conn.end();

    return NextResponse.json({
      response: {
        time: new Date().toISOString(),
        analysis: analysisResult
      }
    });
  } catch (error) {
    console.error("Error processing vision analysis:", error);
    return NextResponse.json({ error: "Failed to analyze vision." }, { status: 500 });
  }
}


