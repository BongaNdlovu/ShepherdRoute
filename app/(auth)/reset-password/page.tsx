import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { resetPasswordAction } from "@/app/(auth)/actions";
import { BrandLogo } from "@/components/app/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = {
  title: "Reset Password"
};

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
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
          <h1 className="text-2xl font-black">Choose a new password</h1>
          <p className="text-muted-foreground">Use the reset link from your email, then save a new password.</p>
        </div>
        <div className="mt-4">
          {params.error ? (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {params.error}
            </div>
          ) : null}
          <form action={resetPasswordAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
            </div>
            <Button size="lg" type="submit">Update password</Button>
          </form>
        </div>
      </div>
    </main>
  );
}
