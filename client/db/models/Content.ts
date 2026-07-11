import { model, models, Schema } from "mongoose";

export interface IContent {
  userId: string; // Clerk user ID (owner)
  title: string;
  caption: string;
  content: string;
  isPublished: boolean;
  created_at: Date;
  upvotes: string[];
  collaborators: string[]; // Clerk user IDs invited to edit
  linkAccess: boolean; // anyone signed-in with the link can edit
}

const ContentSchema = new Schema<IContent>({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  caption: { type: String, required: true },
  content: { type: String, required: true },
  isPublished: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  upvotes: { type: [String], default: [] },
  collaborators: { type: [String], default: [] },
  linkAccess: { type: Boolean, default: false },
});

export const Content = models?.Content || model("Content", ContentSchema);
