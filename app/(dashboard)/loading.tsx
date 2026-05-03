import { PageHeaderSkeleton, StatsGridSkeleton } from "@/components/app/loading-states";

export default function DashboardLoading() {
  return (
    <div className="grid gap-4">
      <PageHeaderSkeleton />
      <StatsGridSkeleton />
    </div>
  );
}
