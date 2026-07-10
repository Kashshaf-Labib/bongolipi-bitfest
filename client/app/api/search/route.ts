import { NextResponse } from "next/server";
import { dbConnect } from "@/db/mongod";
import { User } from "@/db/models/User";
import { Content } from "@/db/models/Content";

export async function GET(req: Request) {
  await dbConnect();

  const url = new URL(req.url);
  const query = url.searchParams.get("q");

  if (!query) {
    return NextResponse.json({ users: [], contents: [] });
  }

  // Escape regex metacharacters so user input can't inject a pattern.
  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  try {
    // Search in Users
    const users = await User.find({
      $or: [
        { firstName: { $regex: safeQuery, $options: "i" } },
        { lastName: { $regex: safeQuery, $options: "i" } },
        { email: { $regex: safeQuery, $options: "i" } },
      ],
    }).select("firstName lastName email userId");

    // Search in Contents
    const contents = await Content.find({
      $or: [
        { title: { $regex: safeQuery, $options: "i" } },
        { caption: { $regex: safeQuery, $options: "i" } },
        { content: { $regex: safeQuery, $options: "i" } },
      ],
    }).select("title caption userId");

    return NextResponse.json({ users, contents });
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
