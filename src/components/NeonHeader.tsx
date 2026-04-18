import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function NeonHeader({ active }: { active?: "home" | "levels" | "endless" | "how" | "customize" }) {
  const link = (label: string, to: string, key: string) => (
    <Link
      to={to}
      className={`font-display text-sm uppercase tracking-widest transition-colors hover:text-neon-pink ${
        active === key ? "text-neon-pink text-glow-pink" : "text-white/80"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="relative z-20 flex items-center justify-between px-5 py-4 md:px-10">
      <Link to="/" className="flex items-center gap-2">
        <div className="h-8 w-8 rotate-12 rounded-md bg-gradient-hero shadow-neon-pink animate-pulse-neon" />
        <span className="font-display text-lg uppercase tracking-widest text-white text-glow-pink md:text-xl">
          Cubefall
        </span>
      </Link>
      <nav className="hidden items-center gap-6 md:flex">
        {link("Home", "/", "home")}
        {link("Levels", "/levels", "levels")}
        {link("Endless", "/endless", "endless")}
        {link("Customize", "/customize", "customize")}
        {link("How to play", "/how-to-play", "how")}
      </nav>
      <Link to="/levels" className="md:hidden">
        <Button size="sm" variant="secondary">Play</Button>
      </Link>
    </header>
  );
}
