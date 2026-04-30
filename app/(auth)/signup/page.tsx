import Link from "next/link";
import { Church } from "lucide-react";
import { signupAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = {
  title: "Signup"
};

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; invite?: string }>;
}) {
  const params = await searchParams;
  const inviteQuery = params.invite ? `?invite=${encodeURIComponent(params.invite)}` : "";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Church className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">{params.invite ? "Create your team account" : "Start ShepherdRoute"}</CardTitle>
          <CardDescription>
            {params.invite ? "Use the invited email address to join the church workspace." : "Create your church workspace with the private platform signup code."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {params.error ? (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {params.error}
            </div>
          ) : null}
          <form action={signupAction} className="grid gap-4">
            {params.invite ? <input type="hidden" name="inviteToken" value={params.invite} /> : null}
            {!params.invite ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="churchName">Church name</Label>
                  <Input id="churchName" name="churchName" placeholder="Pinetown SDA Church" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="platformSignupCode">Signup code</Label>
                  <Input
                    id="platformSignupCode"
                    name="platformSignupCode"
                    type="password"
                    autoComplete="off"
                    placeholder="Enter the platform code"
                    required
                  />
                </div>
              </>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="fullName">Your name</Label>
              <Input id="fullName" name="fullName" autoComplete="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
            </div>
            <Button size="lg" type="submit">{params.invite ? "Create account" : "Create church account"}</Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="font-semibold text-foreground underline-offset-4 hover:underline" href={`/login${inviteQuery}`}>
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
