// Hocuspocus (Yjs) realtime server for collaborative editing.
// Auth: the Next.js app issues a short-lived JWT (signed with COLLAB_SECRET)
// after checking a user's permission for a document. This server only
// verifies that token and that it matches the requested document.
import { Server } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { MongoClient, Binary } from "mongodb";
import jwt from "jsonwebtoken";
import "dotenv/config";

const PORT = Number(process.env.PORT || 1234);
const COLLAB_SECRET = process.env.COLLAB_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;
const DBNAME = process.env.DBNAME || "bongolipi";

if (!COLLAB_SECRET) {
  throw new Error("COLLAB_SECRET environment variable is not set");
}

// Optional MongoDB persistence for Yjs document state.
let collection = null;
if (MONGODB_URI) {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  collection = client.db(DBNAME).collection("collab_states");
  await collection.createIndex({ name: 1 }, { unique: true });
  console.log("[collab] connected to MongoDB");
} else {
  console.warn(
    "[collab] MONGODB_URI not set — documents will not persist across restarts",
  );
}

const extensions = collection
  ? [
      new Database({
        fetch: async ({ documentName }) => {
          const doc = await collection.findOne({ name: documentName });
          return doc?.state ? doc.state.buffer : null;
        },
        store: async ({ documentName, state }) => {
          await collection.updateOne(
            { name: documentName },
            {
              $set: {
                name: documentName,
                state: new Binary(state),
                updatedAt: new Date(),
              },
            },
            { upsert: true },
          );
        },
      }),
    ]
  : [];

const server = Server.configure({
  port: PORT,
  extensions,
  async onAuthenticate({ token, documentName }) {
    if (!token) throw new Error("Missing token");

    let payload;
    try {
      payload = jwt.verify(token, COLLAB_SECRET);
    } catch {
      throw new Error("Invalid token");
    }

    if (payload.docId !== documentName) {
      throw new Error("Token is not valid for this document");
    }

    // Context is available to later hooks (not required for cursors, which the
    // client sets via awareness).
    return {
      user: { id: payload.sub, name: payload.name, color: payload.color },
    };
  },
});

server.listen();
console.log(`[collab] Hocuspocus listening on ws://localhost:${PORT}`);
