import Chat from "@/db/models/Chat";
import { dbConnect } from "@/db/mongod";
import { getAuth } from "@clerk/nextjs/server";
import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

export const POST = async (req: NextRequest) => {
    const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
    });
    try {
        const { content } = await req.json();
        const sessionId = req.nextUrl.searchParams.get('sessionId');

        if (!content) {
            return NextResponse.json(
                { error: 'SessionId or message was not provided' },
                { status: 401 },
            );
        }

        const { userId } = getAuth(req);
        await dbConnect();

        // Replay recent history so the assistant has conversational memory.
        const history = sessionId
            ? await Chat.find({ sessionId, userId }).sort({ createdAt: 1 }).limit(20)
            : [];

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content:
                        `You are a highly accurate Banglish to Bangla translator AI.
Your goal is to read the provided text and produce a correct reply, clear, and natural-sounding Bangla.
For example:
"user": "Kemon acho?"
"assistant": "ভালো আছি, ধন্যবাদ।"
`,
                },
                ...history.map((m) => ({
                    role: m.role as 'user' | 'assistant',
                    content: m.content,
                })),
                {
                    role: 'user',
                    content: `${content}`,
                },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 1,
            max_tokens: 1024,
            top_p: 1,
            stream: false,
            stop: null,
        });

        const assistantResponse =
            chatCompletion.choices[0]?.message?.content || 'No response was generated';

        const newSessionId = sessionId || randomUUID();
        const chat = new Chat({ userId, sessionId: newSessionId, content, role: "user" });
        await chat.save();

        const assistantChat = new Chat({ userId, sessionId: newSessionId, content: assistantResponse, role: "assistant" });
        await assistantChat.save();
        return NextResponse.json({response: assistantChat, sessionId: newSessionId});

    } catch (error) {
        console.log(error);
        return NextResponse.json(
            { error: 'Something went wrong. Please try again later.' },
            { status: 500 },
        );

    }
}
