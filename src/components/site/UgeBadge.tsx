import { IdCard } from "lucide-react";
import { cn } from "@/lib/utils";

export function UgeBadge({
  variant = "soft",
  className,
}: {
  variant?: "soft" | "solid";
  className?: string;
}) {
  if (variant === "solid") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-brand-blue text-brand-blue-foreground px-3 py-1.5 text-sm font-semibold",
          className,
        )}
      >
        <IdCard className="h-4 w-4" />
        Carteira de estudante digital UGE
      </div>
    );
  }
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-brand-blue-soft text-brand-blue px-3 py-1 text-xs font-medium",
        className,
      )}
    >
      <IdCard className="h-3.5 w-3.5" />
      Carteira UGE após matrícula
    </div>
  );
}
