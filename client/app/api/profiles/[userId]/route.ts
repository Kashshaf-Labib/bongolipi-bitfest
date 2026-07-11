import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/db/mongod";
import { Content } from "@/db/models/Content";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    let user;
    try {
      const client = await clerkClient();
      user = await client.users.getUser(userId);
    } catch {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await dbConnect();
    const contents = await Content.find({ userId, isPublished: true })
      .select("title caption created_at upvotes")
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json({
      user: {
        userId,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.emailAddresses?.[0]?.emailAddress || "",
        imageUrl: user.imageUrl || "",
      },
      contents: contents.map((c) => ({
        _id: String(c._id),
        title: c.title,
        caption: c.caption,
        created_at: c.created_at,
        upvotes: c.upvotes || [],
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
