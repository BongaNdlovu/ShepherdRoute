import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requestPasswordResetAction } from "@/app/(auth)/actions";
import { BrandLogo } from "@/components/app/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = {
  title: "Forgot Password"
};

export default async function ForgotPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="cinematic-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Button asChild variant="ghost" className="px-0">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </Button>
        </div>
        <div className="text-center">
          <BrandLogo className="mx-auto mb-3 h-20 w-auto object-contain" priority />
          <h1 className="text-2xl font-black">Reset your password</h1>
          <p className="text-muted-foreground">Enter your account email and ShepherdRoute will send you a secure reset link.</p>
        </div>
        <div className="mt-4">
          {params.error ? (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {params.error}
            </div>
          ) : null}
          {params.sent === "true" ? (
            <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              If that email exists, a password reset link has been sent.
            </div>
          ) : null}
          <form action={requestPasswordResetAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <Button size="lg" type="submit">Send reset link</Button>
          </form>
        </div>
      </div>
    </main>
  );
}
