import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { dbConnect } from "@/db/mongod";
import { Content } from "@/db/models/Content";
import { canEditContent, userColor } from "@/lib/collab";

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!process.env.COLLAB_SECRET) {
      return NextResponse.json(
        { error: "Collaboration is not configured" },
        { status: 500 },
      );
    }

    const { docId } = await req.json();
    if (!docId) {
      return NextResponse.json({ error: "docId is required" }, { status: 400 });
    }

    await dbConnect();
    const content = await Content.findById(docId);
    if (!content) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!canEditContent(content, userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ") || "User";

    const color = userColor(userId);
    const token = jwt.sign(
      { sub: userId, docId: String(docId), name, color },
      process.env.COLLAB_SECRET,
      { expiresIn: "2h" },
    );

    return NextResponse.json({ token, name, color });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
