"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NavigationHistoryControls() {
  const router = useRouter();

  return (
    <div className="surface-card mb-4 flex flex-wrap items-center gap-2 rounded-2xl p-3">
      <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => router.forward()}>
        <ArrowRight className="h-4 w-4" />
        Forward
      </Button>
      <Button asChild variant="ghost" size="sm">
        <Link href="/dashboard">
          <Home className="h-4 w-4" />
          Dashboard
        </Link>
      </Button>
    </div>
  );
}
