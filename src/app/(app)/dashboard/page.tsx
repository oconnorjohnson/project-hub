import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your projects.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="font-semibold mb-2">Active Projects</h3>
          <p className="text-3xl font-bold text-primary">0</p>
          <p className="text-sm text-muted-foreground">No projects yet</p>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h3 className="font-semibold mb-2">Tasks Due Today</h3>
          <p className="text-3xl font-bold text-orange-500">0</p>
          <p className="text-sm text-muted-foreground">All caught up!</p>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h3 className="font-semibold mb-2">Recent Activity</h3>
          <p className="text-3xl font-bold text-green-500">0</p>
          <p className="text-sm text-muted-foreground">No recent updates</p>
        </div>
      </div>

      {/* Getting Started */}
      <div className="mt-8 bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Create your first project to organize your work</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-muted rounded-full"></div>
            <span className="text-muted-foreground">
              Add tasks and documents to your project
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-muted rounded-full"></div>
            <span className="text-muted-foreground">
              Collaborate with your team
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
