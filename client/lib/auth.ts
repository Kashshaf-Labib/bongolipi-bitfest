import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

/**
 * Server-side admin check. Reads the user's Clerk publicMetadata.role so it
 * works without a custom session-token claim.
 */
export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  const { userId } = getAuth(req);
  if (!userId) return false;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return (user.publicMetadata as { role?: string })?.role === "admin";
}
