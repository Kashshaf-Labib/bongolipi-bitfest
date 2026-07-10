// import { NextResponse } from "next/server";
// import {dbConnect} from "@/db/mongod";
// import Contribution from "@/db/models/Contribution";
// import {Content} from "@/db/models/Content";
// import { clerkClient } from "@clerk/clerk-sdk-node"; // Clerk API for user count

// export async function GET() {
//   await dbConnect();

//   try {
//     // Fetch data
//     const totalUsers = await clerkClient.users.getCount(); // Clerk total users
//     const totalContents = await Content.countDocuments();
//     const totalPendingPosts = await Contribution.countDocuments({ isApproved: false });
//     const totalApprovedPosts = await Contribution.countDocuments({ isApproved: true });

//     return NextResponse.json({
//       totalUsers,
//       totalContents,
//       totalPendingPosts,
//       totalApprovedPosts,
//     });
//   } catch (error) {
//     console.error("Error fetching analytics:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/db/mongod";
import Contribution from "@/db/models/Contribution";
import { Content } from "@/db/models/Content";
import { clerkClient } from "@clerk/clerk-sdk-node"; // Clerk API for user count
import { isAdminRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    // Fetch data
    const totalUsers = await clerkClient.users.getCount(); // Clerk total users
    const totalContents = await Content.countDocuments();
    const totalPendingContributions = await Contribution.countDocuments({ isApproved: false });
    const totalApprovedContributions = await Contribution.countDocuments({ isApproved: true });

    return NextResponse.json({
      totalUsers,
      totalContents,
      totalPendingContributions,
      totalApprovedContributions,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
