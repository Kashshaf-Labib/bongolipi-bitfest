import { NextResponse } from "next/server";
import { dbConnect } from "@/db/mongod";
import { User } from "@/db/models/User";
import { Content } from "@/db/models/Content";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(Number(url.searchParams.get("limit")) || 6, 20);

  if (query.length < 1) {
    return NextResponse.json({ users: [], contents: [] });
  }

  await dbConnect();

  // Escape regex metacharacters so user input can't inject a pattern.
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rx = { $regex: safe, $options: "i" };

  try {
    const [users, contents] = await Promise.all([
      // Never expose email in results, but still allow matching by it.
      User.find({ $or: [{ firstName: rx }, { lastName: rx }, { email: rx }] })
        .select("firstName lastName userId")
        .limit(limit)
        .lean(),
      // Only published content is searchable.
      Content.find({ isPublished: true, $or: [{ title: rx }, { caption: rx }] })
        .select("title caption userId created_at")
        .sort({ created_at: -1 })
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({ users, contents });
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
