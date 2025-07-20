'use client';

import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useYahooFantasy } from "@/hooks/use-yahoo-fantasy";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const { useUserInfo } = useYahooFantasy();
  const { isLoading: isLoadingUserInfo } = useUserInfo();

  const handleSignIn = () => {
    signIn('yahoo', { callbackUrl: '/' });
  };

  if (status === "loading" || isLoadingUserInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Yahoo Fantasy Baseball Tool</h1>
          <p className="mb-4">Please sign in with your Yahoo account to get started.</p>
          <Button 
            className="cursor-pointer w-full bg-[#7d2eff] py-3"
            onClick={handleSignIn}
          >
            Sign in with Yahoo
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 