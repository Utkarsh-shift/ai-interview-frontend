import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("uploadFile") as Blob;
    const partType = formData.get("part_type") as string;
    const recordingId = formData.get("recording_id") as string;
    const sessionId = formData.get("session_id") as string;
    const type = formData.get("type") as string;

    if (!file || !recordingId || !sessionId || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const baseDir = type === "screen"
      ? path.join(process.cwd(), "public", "screen_uploads")
      : path.join(process.cwd(), "public", "uploads");

    const sessionDir = path.join(baseDir, sessionId);
    await mkdir(sessionDir, { recursive: true });

    const existingChunks = fs
      .readdirSync(sessionDir)
      .filter(name => /^chunk\d+\.mp4$/.test(name));

    const existingNumbers = existingChunks.map(name => parseInt(name.match(/\d+/)![0]));
    const nextChunkIndex = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

    const fileName = `chunk${nextChunkIndex}.mp4`;
    const filePath = path.join(sessionDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
  

    const allChunks = fs
      .readdirSync(sessionDir)
      .filter(f => /^chunk\d+\.mp4$/.test(f));

    const chunkNumbers = allChunks.map(name => parseInt(name.match(/\d+/)![0]));
    const maxChunk = Math.max(...chunkNumbers);
    const expectedChunks = Array.from({ length: maxChunk }, (_, i) => `chunk${i + 1}.mp4`);
    const allExist = expectedChunks.every(chunk => fs.existsSync(path.join(sessionDir, chunk)));

    if (allExist && allChunks.length === expectedChunks.length) {

    } else {
      console.log(` Waiting for chunks: Found ${allChunks.length}, expected ${maxChunk}`);
    }

    return NextResponse.json({ success: true, chunkIndex: nextChunkIndex });

  } catch (error) {
    console.error(" Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}