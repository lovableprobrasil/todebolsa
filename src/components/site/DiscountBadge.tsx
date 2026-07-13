import { cn } from "@/lib/utils";

export function DiscountBadge({
  percent,
  className,
  size = "md",
}: {
  percent: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-bold",
        sizes[size],
        className,
      )}
      style={{
        backgroundColor: "var(--warning-soft)",
        color: "var(--warning-ink)",
      }}
    >
      {percent}% OFF
    </span>
  );
}
