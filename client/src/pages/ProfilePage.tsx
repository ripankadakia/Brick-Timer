import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User as UserIcon } from "lucide-react";
import type { User } from "@shared/schema";

export default function ProfilePage() {
  const { user } = useAuth() as { user: User | undefined };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="h-full overflow-y-auto p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>

        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <Button
              variant="destructive"
              size="lg"
              onClick={handleLogout}
              className="w-full"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">About</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Version:</strong> 1.0.0
            </p>
            <p>
              <strong>App:</strong> Interval Timer
            </p>
            <p className="pt-2">
              Track your workouts, analyze your performance, and reach your fitness goals.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
