import { AlertCircle, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  variant: "empty" | "error";
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
};

export function SectionState({ variant, title, description, action }: Props) {
  const Icon = variant === "error" ? AlertCircle : SearchX;
  return (
    <div
      role={variant === "error" ? "alert" : undefined}
      className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center"
    >
      <span
        className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-4 ${
          variant === "error"
            ? "bg-destructive/10 text-destructive"
            : "bg-secondary text-muted-foreground"
        }`}
      >
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          {description}
        </p>
      ) : null}
      {action ? (
        <div className="mt-5">
          <Button variant="outline" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
