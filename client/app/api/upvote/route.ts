import { NextResponse } from "next/server";
import { dbConnect } from "@/db/mongod";
import { Content } from "@/db/models/Content";

export async function PATCH(req: Request) {
  await dbConnect();
  const { contentId, userId } = await req.json();

  if (!contentId || !userId) {
    return NextResponse.json({ error: "Content ID and User ID are required" }, { status: 400 });
  }

  const content = await Content.findById(contentId);

  if (!content) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  const hasUpvoted = content.upvotes.includes(userId);

  if (hasUpvoted) {
    content.upvotes = content.upvotes.filter((id: string) => id !== userId);
  } else {
    content.upvotes.push(userId);
  }

  await content.save();

  return NextResponse.json({ upvotes: content.upvotes });
}
