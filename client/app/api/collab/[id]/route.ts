import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/db/mongod";
import { Content } from "@/db/models/Content";
import { canEditContent } from "@/lib/collab";

// Load a document for the collaborative editor (edit access required).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const content = await Content.findById(id);
    if (!content) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!canEditContent(content, userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const client = await clerkClient();
    let collaborators: { userId: string; name: string; image: string }[] = [];
    if (content.collaborators?.length) {
      const { data } = await client.users.getUserList({
        userId: content.collaborators,
        limit: 100,
      });
      collaborators = data.map((u) => ({
        userId: u.id,
        name: [u.firstName, u.lastName].filter(Boolean).join(" ") || "User",
        image: u.imageUrl || "",
      }));
    }

    return NextResponse.json({
      title: content.title,
      content: content.content,
      isOwner: content.userId === userId,
      linkAccess: !!content.linkAccess,
      collaborators,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Save the current HTML (and title) back to the document.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    await dbConnect();
    const content = await Content.findById(id);
    if (!content) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!canEditContent(content, userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (typeof body.content === "string") content.content = body.content;
    if (typeof body.title === "string" && body.title.trim())
      content.title = body.title;

    await content.save();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
