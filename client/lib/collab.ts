// Shared helpers for collaborative editing access control.

export type CollabContent = {
  userId: string;
  collaborators?: string[];
  linkAccess?: boolean;
};

/** A signed-in user may edit if they are the owner, an invited collaborator,
 *  or the document has link access enabled. */
export function canEditContent(
  content: CollabContent,
  userId: string | null | undefined,
): boolean {
  if (!userId) return false;
  if (content.userId === userId) return true;
  if (content.collaborators?.includes(userId)) return true;
  return !!content.linkAccess;
}

const COLORS = [
  "#C4562E",
  "#E9A23B",
  "#5B8C51",
  "#3B82C6",
  "#8B5CF6",
  "#DB2777",
  "#0D9488",
  "#D97706",
];

/** Deterministic cursor color for a user. */
export function userColor(userId: string): string {
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = (h * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return COLORS[h % COLORS.length];
}
