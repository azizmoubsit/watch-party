import { cn } from "@/lib/utils";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-slate-800/70 border border-slate-700/40",
        className
      )}
      {...props}
    />
  );
}

export function SkeletonVideoPlayer() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-video w-full rounded-2xl" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-6 w-48 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonParticipantList() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
