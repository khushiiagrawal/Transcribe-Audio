import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { writeFile } from "fs/promises";
import { unlink } from "fs/promises";
import path from "path";
import os from "os";

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: { message: "No file provided" } },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Create temporary file path using os.tmpdir()
    const tempDir = os.tmpdir();
    // Generate a unique filename to avoid collisions
    const uniqueFilename = `upload-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}${path.extname(file.name)}`;
    tempFilePath = path.join(tempDir, uniqueFilename);

    // Write the buffer to the temporary file
    await writeFile(tempFilePath, buffer);

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const transcription = await groq.audio.transcriptions.create({
      file: (await import("fs")).createReadStream(tempFilePath),
      model: "whisper-large-v3",
      response_format: "json",
      language: "en",
      temperature: 0.0,
    });

    // Clean up: Delete the temporary file
    if (tempFilePath) {
      await unlink(tempFilePath);
    }

    return NextResponse.json(transcription);
  } catch (error) {
    console.error("Transcription error:", error);

    // Clean up: Make sure we delete the temp file even if there's an error
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (cleanupError) {
        console.error("Error cleaning up temporary file:", cleanupError);
      }
    }

    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to transcribe audio",
        },
      },
      { status: 500 }
    );
  }
}
