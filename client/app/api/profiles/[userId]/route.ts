import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/db/mongod";
import { Content } from "@/db/models/Content";
import { User } from "@/db/models/User";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    await dbConnect();

    const user = await User.findOne({ userId }).select(
      "firstName lastName email userId"
    );
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const contents = await Content.find({ userId, isPublished: true }).select(
      "title caption created_at upvotes"
    );

    return NextResponse.json({ user, contents });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
