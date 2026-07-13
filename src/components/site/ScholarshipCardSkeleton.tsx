import { Card, CardContent } from "@/components/ui/card";

export function ScholarshipCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/60">
      <CardContent className="p-0 animate-pulse">
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-muted" />
            <div className="h-5 w-4/5 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
          <div className="h-6 w-16 rounded-full bg-muted" />
        </div>
        <div className="px-5 pb-3 flex gap-1.5">
          <div className="h-5 w-16 rounded-full bg-muted" />
          <div className="h-5 w-20 rounded-full bg-muted" />
          <div className="h-5 w-14 rounded-full bg-muted" />
        </div>
        <div className="px-5 pb-4 space-y-2">
          <div className="h-3 w-3/4 rounded bg-muted" />
          <div className="h-3 w-2/3 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
        </div>
        <div className="mx-5 mb-3 rounded-xl bg-secondary/60 p-4 space-y-2">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-8 w-40 rounded bg-muted" />
          <div className="h-3 w-2/3 rounded bg-muted" />
        </div>
        <div className="px-5 pb-5 grid grid-cols-2 gap-2">
          <div className="h-9 rounded-md bg-muted" />
          <div className="h-9 rounded-md bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
