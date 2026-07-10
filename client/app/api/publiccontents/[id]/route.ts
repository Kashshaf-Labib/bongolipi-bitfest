import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/db/mongod";
import { Content } from "@/db/models/Content";
import { User } from "@/db/models/User";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();

    const content = await Content.findById(id);
    if (!content || !content.isPublished) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const user = await User.findOne({ userId: content.userId }).select(
      "firstName lastName"
    );

    return NextResponse.json({
      _id: content._id,
      title: content.title,
      caption: content.caption,
      content: content.content,
      created_at: content.created_at,
      userId: content.userId,
      upvotes: content.upvotes || [],
      userName: user ? `${user.firstName} ${user.lastName}` : "Unknown User",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
