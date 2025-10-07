"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStacks } from "@/hooks/use-stacks";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { userData } = useStacks();
  const router = useRouter();

  useEffect(() => {
    if (userData === null) {
      // Wait a bit to see if wallet data loads
      const timeout = setTimeout(() => {
        if (userData === null) {
          router.push("/");
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [userData, router]);

  // Show loading or nothing while checking
  if (userData === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
