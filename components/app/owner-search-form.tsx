import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function OwnerSearchForm({ placeholder = "Search...", defaultValue = "" }: { placeholder?: string; defaultValue?: string }) {
  return (
    <form className="flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={defaultValue} placeholder={placeholder} className="pl-9" />
      </div>
      <Button type="submit" variant="outline">Search</Button>
    </form>
  );
}
