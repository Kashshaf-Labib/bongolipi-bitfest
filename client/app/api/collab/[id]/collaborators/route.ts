import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/db/mongod";
import { Content } from "@/db/models/Content";

// Invite a collaborator by email (owner only).
export async function POST(
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
        { error: "Only the owner can invite" },
        { status: 403 },
      );
    }

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const client = await clerkClient();
    const { data } = await client.users.getUserList({
      emailAddress: [email],
      limit: 1,
    });
    if (!data.length) {
      return NextResponse.json(
        { error: "No user with that email. They must sign up first." },
        { status: 404 },
      );
    }

    const invitee = data[0];
    if (invitee.id === content.userId) {
      return NextResponse.json(
        { error: "That's the owner." },
        { status: 400 },
      );
    }
    if (!content.collaborators.includes(invitee.id)) {
      content.collaborators.push(invitee.id);
      await content.save();
    }

    return NextResponse.json({
      userId: invitee.id,
      name:
        [invitee.firstName, invitee.lastName].filter(Boolean).join(" ") ||
        "User",
      image: invitee.imageUrl || "",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Remove a collaborator (owner only).
export async function DELETE(
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
        { error: "Only the owner can remove collaborators" },
        { status: 403 },
      );
    }

    const { collaboratorId } = await req.json();
    content.collaborators = content.collaborators.filter(
      (c: string) => c !== collaboratorId,
    );
    await content.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
