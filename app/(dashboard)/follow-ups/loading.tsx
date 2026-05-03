import { ListPageSkeleton, PageHeaderSkeleton } from "@/components/app/loading-states";

export default function FollowUpsLoading() {
  return (
    <section className="space-y-4">
      <PageHeaderSkeleton />
      <ListPageSkeleton rows={6} />
    </section>
  );
}
