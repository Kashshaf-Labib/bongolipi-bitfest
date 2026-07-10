import { NextRequest, NextResponse } from "next/server";
import {dbConnect} from "../../../db/mongod";
import Contribution from "@/db/models/Contribution";
import { isAdminRequest } from "@/lib/auth";

// Fetch contributions (pending or all)
export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  const url = new URL(req.url);
  const isApproved = url.searchParams.get("isApproved");

  const filter = isApproved !== null ? { isApproved: isApproved === "true" } : {};
  const contributions = await Contribution.find(filter);

  return NextResponse.json(contributions);
}

// Approve a contribution
export async function PATCH(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Contribution ID is required" }, { status: 400 });
  }

  const contribution = await Contribution.findById(id);

  if (!contribution) {
    return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
  }

  contribution.isApproved = true;
  await contribution.save();

  return NextResponse.json({ message: "Contribution approved successfully" });
}
