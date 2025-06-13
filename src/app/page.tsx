import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SignedOut>
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to Project Hub</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Organize your projects, tasks, docs, and timeline in one place.
          </p>
          <p className="text-sm text-muted-foreground">
            Please sign in to get started.
          </p>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Welcome back! Your project hub is ready.
          </p>
        </div>
      </SignedIn>
    </div>
  );
}
