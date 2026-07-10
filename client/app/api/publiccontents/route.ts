import { NextResponse } from "next/server";
import { dbConnect } from "@/db/mongod";
import { Content } from "@/db/models/Content";
import { User } from "@/db/models/User";

export async function GET() {
  await dbConnect();

  try {
    const contents = await Content.find({ isPublished: true }).select(
      "title caption userId created_at content upvotes"
    );

    // Fetch user details for each content
    const enrichedContents = await Promise.all(
      contents.map(async (content) => {
        const user = await User.findOne({ userId: content.userId }).select(
          "firstName lastName"
        );

        return {
          _id: content._id,
          title: content.title,
          caption: content.caption,
          content: content.content,
          created_at: content.created_at,
          userId: content.userId,
          upvotes: content.upvotes || [],
          userName: user ? `${user.firstName} ${user.lastName}` : "Unknown User",
        };
      })
    );

    return NextResponse.json(enrichedContents);
  } catch (error) {
    console.error("Error fetching contents:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

