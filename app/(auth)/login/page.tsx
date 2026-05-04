import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { loginAction } from "@/app/(auth)/actions";
import { BrandLogo } from "@/components/app/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = {
  title: "Login"
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; invite?: string }>;
}) {
  const params = await searchParams;
  const inviteQuery = params.invite ? `?invite=${encodeURIComponent(params.invite)}` : "";

  return (
    <main className="cinematic-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Button asChild variant="ghost" className="px-0">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to landing page
            </Link>
          </Button>
        </div>
        <div className="text-center">
          <BrandLogo className="mx-auto mb-3 h-20 w-auto object-contain" priority />
          <h1 className="text-2xl font-black">{params.invite ? "Login to accept invite" : "Welcome back to ShepherdRoute"}</h1>
          <p className="text-muted-foreground">
            {params.invite ? "Use the invited email address so the workspace can be linked safely." : "The follow-up pathway for churches that care."}
          </p>
        </div>
        <div className="mt-4">
          {params.error ? (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {params.error}
            </div>
          ) : null}
          <form action={loginAction} className="grid gap-4">
            {params.invite ? <input type="hidden" name="inviteToken" value={params.invite} /> : null}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" minLength={8} required />
            </div>
            <Button size="lg" type="submit">Login</Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {params.invite ? "Need an account?" : "New church?"}{" "}
            <Link className="font-semibold text-foreground underline-offset-4 hover:underline" href={`/signup${inviteQuery}`}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
