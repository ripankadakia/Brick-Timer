import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

type AuthConfig = {
  enabled: boolean;
  message?: string;
};

export default function LoginPage() {
  const { data, isLoading } = useQuery<AuthConfig>({
    queryKey: ["/api/auth/config"],
    retry: false,
  });

  return (
    <div className="h-screen overflow-y-auto flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground">Sign in with Google or email/password.</p>
        </div>

        {!isLoading && data && !data.enabled && (
          <p className="text-sm text-destructive text-center">{data.message}</p>
        )}

        <div className="space-y-3">
          <Button className="w-full" onClick={() => (window.location.href = "/api/login?method=google")}> 
            Continue with Google
          </Button>

          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = "/api/login?method=password";
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" required />
            </div>
            <Button className="w-full" type="submit">
              Sign in with Email
            </Button>
          </form>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-muted-foreground underline underline-offset-4">
            Back to home
          </Link>
        </div>
      </Card>
    </div>
  );
}
