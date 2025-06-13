"use client";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function Topbar() {
  return (
    <header className="flex justify-between items-center p-4 border-b h-16">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold">Project Hub</h1>
      </div>

      <div className="flex items-center gap-4">
        <ThemeSwitcher />
        <SignedOut>
          <SignInButton />
          <SignUpButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
}
