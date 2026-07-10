import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

export const POST = async (req: NextRequest) => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const form = await req.formData();
    const audio = form.get("audio");

    if (!(audio instanceof File)) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    const response = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      response_format: "text",
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 },
    );
  }
};
