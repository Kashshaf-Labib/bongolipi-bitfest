import { NextResponse } from "next/server";
import { dbConnect } from "@/db/mongod";
import { User } from "@/db/models/User";

export async function POST(req: Request) {
  await dbConnect();

  try {
    const { userId, firstName, lastName, email } = await req.json();

    if (!userId || !firstName || !lastName || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Idempotent sync: create on first sign-up, keep in sync afterwards.
    const user = await User.findOneAndUpdate(
      { userId },
      { $set: { firstName, lastName, email } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ message: "User synced successfully", user });
  } catch (error) {
    console.error("Error saving user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
