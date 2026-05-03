import { FormCardSkeleton, ListPageSkeleton } from "@/components/app/loading-states";

export default function ContactsLoading() {
  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <ListPageSkeleton rows={6} />
      <FormCardSkeleton fields={5} />
    </section>
  );
}
