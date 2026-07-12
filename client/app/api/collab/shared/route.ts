import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/db/mongod";
import { Content } from "@/db/models/Content";

// Documents where the current user is an invited collaborator.
export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const contents = await Content.find({ collaborators: userId })
      .select("title caption userId created_at")
      .sort({ created_at: -1 })
      .lean();

    const ownerIds = [...new Set(contents.map((c) => c.userId))];
    const ownerMap: Record<string, string> = {};
    if (ownerIds.length) {
      const client = await clerkClient();
      const { data } = await client.users.getUserList({
        userId: ownerIds,
        limit: 100,
      });
      for (const u of data) {
        ownerMap[u.id] =
          [u.firstName, u.lastName].filter(Boolean).join(" ") || "User";
      }
    }

    return NextResponse.json(
      contents.map((c) => ({
        _id: String(c._id),
        title: c.title,
        caption: c.caption,
        ownerName: ownerMap[c.userId] || "Unknown",
      })),
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
