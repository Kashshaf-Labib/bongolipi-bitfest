import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="font-balooda text-lg font-bold text-foreground">
            <span className="text-primary">ব</span>ঙ্গলিপি
          </p>
          <p className="text-sm text-muted-foreground">Bangla, made simple.</p>
        </div>

        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/converter" className="transition-colors hover:text-primary">
            Converter
          </Link>
          <Link href="/contents" className="transition-colors hover:text-primary">
            Contents
          </Link>
          <Link href="/chatbot" className="transition-colors hover:text-primary">
            Chatbot
          </Link>
          <Link href="/contribute" className="transition-colors hover:text-primary">
            Contribute
          </Link>
        </nav>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Bongolipi
        </p>
      </div>
    </footer>
  );
}
