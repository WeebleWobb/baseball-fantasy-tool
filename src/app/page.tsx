'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useYahooFantasy } from "@/hooks/use-yahoo-fantasy";

export default function Home() {
  const { data: session, status } = useSession();
  const { useUserInfo } = useYahooFantasy();
  const { data: userInfo, isLoading: isLoadingUserInfo } = useUserInfo();

  console.log(userInfo);

  const handleSignIn = () => {
    signIn('yahoo', { callbackUrl: '/' })
  }

  const handleSignOut = () => {
    signOut({ redirect: true, callbackUrl: "/" })
  }

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
              className="cursor-pointer w-full bg-[#7d2eff]"
              onClick={handleSignIn}
            >
              Sign in with Yahoo
            </Button>
        </div>
      </div>
    );
  }

  const userName = userInfo?.fantasy_content?.users?.[0]?.user?.[1]?.profile?.display_name;
  const userProfileUrl = userInfo?.fantasy_content?.users?.[0]?.user?.[1]?.profile?.fantasy_profile_url;
  const userImageUrl = userInfo?.fantasy_content?.users?.[0]?.user?.[1]?.profile?.image_url;
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Welcome, {userName || 'User'}</h1>
          <img src={userImageUrl} alt="User Profile" className="w-10 h-10 rounded-full" />
          <a 
            href={`${userProfileUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#7d2eff] hover:underline"
          >
            View Profile
          </a>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
      <div className="grid gap-6">
        {/* We'll add player comparison components here later */}
        <p>Player comparison features coming soon!</p>
      </div>
    </div>
  );
}
