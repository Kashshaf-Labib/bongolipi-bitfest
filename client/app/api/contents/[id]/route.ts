import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/db/mongod";
import { Content } from "@/db/models/Content";
import { getAuth } from "@clerk/nextjs/server";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const content = await Content.findById(id);
    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }
    if (content.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
};

export const PATCH = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { title, caption, content, isPublished } = await req.json();

    await dbConnect();

    const existing = await Content.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }
    if (existing.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (title !== undefined) existing.title = title;
    if (caption !== undefined) existing.caption = caption;
    if (content !== undefined) existing.content = content;
    if (typeof isPublished === "boolean") existing.isPublished = isPublished;

    await existing.save();

    return NextResponse.json({ message: "Content updated successfully." });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
};
