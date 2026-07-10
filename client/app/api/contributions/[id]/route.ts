import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/db/mongod";
import Contribution from "@/db/models/Contribution";
import { isAdminRequest } from "@/lib/auth";

// DELETE Contribution
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    const { id } = await params;

    const contribution = await Contribution.findByIdAndDelete(id);

    if (!contribution) {
      return NextResponse.json(
        { error: "Contribution not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Contribution deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
