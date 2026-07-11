"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";

export default function HeroSection() {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden bg-warm-glow">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center lg:text-left"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
            <Sparkles size={14} className="text-secondary" /> বাংলিশ → বাংলা
          </span>

          <h1 className="mt-5 font-balooda text-4xl font-bold leading-tight text-foreground text-balance sm:text-5xl lg:text-6xl">
            Write Banglish. Get beautiful{" "}
            <span className="text-primary">বাংলা</span>.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground lg:mx-0">
            Convert Banglish to Bangla, write and share stories, and chat in
            Bangla — all in one warm, community-driven space.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Button size="lg" onClick={() => router.push("/sign-up")}>
              Get started <ArrowRight size={18} />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/converter")}
            >
              Try the converter
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <div className="rounded-2xl border border-border bg-card p-6 shadow-warm-lg">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Banglish
            </p>
            <p className="mt-1 text-lg text-foreground">
              Ajke amar mon onek bhalo
            </p>

            <div className="my-4 flex items-center gap-3 text-primary">
              <div className="h-px flex-1 bg-border" />
              <ArrowRight size={18} />
              <div className="h-px flex-1 bg-border" />
            </div>

            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              বাংলা
            </p>
            <p className="mt-1 font-bengali text-xl text-foreground">
              আজকে আমার মন অনেক ভালো
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
