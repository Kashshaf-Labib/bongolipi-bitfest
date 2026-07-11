"use client";

import { motion } from "framer-motion";
import {
  Languages,
  PenLine,
  Bot,
  Search,
  Mic,
  HeartHandshake,
} from "lucide-react";

const features = [
  {
    icon: Languages,
    name: "Banglish → Bangla",
    desc: "Convert Banglish into natural Bangla instantly, and fine-tune the result as you write.",
  },
  {
    icon: PenLine,
    name: "Write & publish",
    desc: "Compose stories in a rich editor, publish them, and export clean, selectable Bangla PDFs.",
  },
  {
    icon: Bot,
    name: "AI chatbot",
    desc: "Chat in Bangla or Banglish — even ask questions about your own uploaded PDFs.",
  },
  {
    icon: Search,
    name: "Search everything",
    desc: "Find people and published content across the app using Bangla or Banglish queries.",
  },
  {
    icon: Mic,
    name: "Voice to text",
    desc: "Speak instead of typing and turn your voice into text in seconds.",
  },
  {
    icon: HeartHandshake,
    name: "Community-powered",
    desc: "Contribute Banglish–Bangla pairs that help the translation keep getting better.",
  },
];

export default function FeatureSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-balooda text-3xl font-bold text-foreground sm:text-4xl">
            Everything you need for Bangla
          </h2>
          <p className="mt-3 text-muted-foreground">
            A focused set of features — done well.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-warm transition-shadow hover:shadow-warm-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon size={24} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {f.name}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
