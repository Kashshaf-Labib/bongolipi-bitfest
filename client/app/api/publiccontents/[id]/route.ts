import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/db/mongod";
import { Content } from "@/db/models/Content";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await dbConnect();

    const content = await Content.findById(id).lean();
    if (!content || Array.isArray(content) || !content.isPublished) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    let userName = "Unknown user";
    let userImage = "";
    try {
      const client = await clerkClient();
      const u = await client.users.getUser(content.userId);
      userName = [u.firstName, u.lastName].filter(Boolean).join(" ") || "User";
      userImage = u.imageUrl || "";
    } catch {
      // fall back to defaults
    }

    return NextResponse.json({
      _id: String(content._id),
      title: content.title,
      caption: content.caption,
      content: content.content,
      created_at: content.created_at,
      userId: content.userId,
      upvotes: content.upvotes || [],
      userName,
      userImage,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
