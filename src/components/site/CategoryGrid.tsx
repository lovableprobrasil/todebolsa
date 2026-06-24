import { Link } from "@tanstack/react-router";
import {
  GraduationCap, Award, Wrench, School, Backpack, Languages, Target,
  Briefcase, BookOpen, Lightbulb, Microscope, TrendingUp, Sparkles,
  type LucideIcon,
} from "lucide-react";
import { CATEGORIES } from "@/lib/format";

const ICONS: Record<string, LucideIcon> = {
  GraduationCap, Award, Wrench, School, Backpack, Languages, Target,
  Briefcase, BookOpen, Lightbulb, Microscope, TrendingUp, Sparkles,
};

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
      {CATEGORIES.map((c) => {
        const Icon = ICONS[c.icon] ?? Sparkles;
        return (
          <Link
            key={c.slug}
            to="/bolsas"
            search={{ level: c.slug }}
            className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-center hover:border-primary hover:bg-accent/40 hover:-translate-y-0.5 transition-all"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium leading-tight">{c.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
