import { NextResponse } from "next/server";
import { dbConnect } from "@/db/mongod";
import { Content } from "@/db/models/Content";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET() {
  await dbConnect();

  try {
    const contents = await Content.find({ isPublished: true })
      .select("title caption userId created_at content upvotes")
      .sort({ created_at: -1 })
      .lean();

    // Enrich authors from Clerk (source of truth for name + photo).
    const userIds = [...new Set(contents.map((c) => c.userId))];
    const userMap: Record<string, { name: string; image: string }> = {};

    if (userIds.length) {
      const client = await clerkClient();
      const { data } = await client.users.getUserList({
        userId: userIds,
        limit: 500,
      });
      for (const u of data) {
        userMap[u.id] = {
          name: [u.firstName, u.lastName].filter(Boolean).join(" ") || "User",
          image: u.imageUrl || "",
        };
      }
    }

    const enriched = contents.map((c) => ({
      _id: String(c._id),
      title: c.title,
      caption: c.caption,
      content: c.content,
      created_at: c.created_at,
      userId: c.userId,
      upvotes: c.upvotes || [],
      userName: userMap[c.userId]?.name || "Unknown user",
      userImage: userMap[c.userId]?.image || "",
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching contents:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
