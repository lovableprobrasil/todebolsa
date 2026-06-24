import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReviewStars({
  value,
  onChange,
  size = "sm",
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
}) {
  const sizeCls = size === "lg" ? "h-7 w-7" : size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const Btn: "button" | "span" = readOnly ? "span" : "button";
        return (
          <Btn
            key={n}
            type={readOnly ? undefined : "button"}
            onClick={readOnly ? undefined : () => onChange?.(n)}
            aria-label={readOnly ? undefined : `${n} estrela${n > 1 ? "s" : ""}`}
            className={cn(
              "transition-transform",
              !readOnly && "hover:scale-110 cursor-pointer",
            )}
          >
            <Star
              className={cn(
                sizeCls,
                filled ? "fill-warning text-warning" : "text-muted-foreground/40",
              )}
            />
          </Btn>
        );
      })}
    </div>
  );
}
