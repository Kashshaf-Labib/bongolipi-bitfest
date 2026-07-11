import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/db/mongod";
import { Content } from "@/db/models/Content";

// Toggle "anyone with the link can edit" (owner only).
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
    await dbConnect();
    const content = await Content.findById(id);
    if (!content) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (content.userId !== userId) {
      return NextResponse.json(
        { error: "Only the owner can change link access" },
        { status: 403 },
      );
    }

    const { linkAccess } = await req.json();
    content.linkAccess = !!linkAccess;
    await content.save();

    return NextResponse.json({ linkAccess: content.linkAccess });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
