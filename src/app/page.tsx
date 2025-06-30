'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useYahooFantasy } from "@/hooks/use-yahoo-fantasy";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { columns } from "@/components/players-table/columns";
import { DataTable } from "@/components/players-table/data-table";
import React from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const { useUserInfo, usePlayers } = useYahooFantasy();
  const { data: userInfo, isLoading: isLoadingUserInfo } = useUserInfo();
  
  // Add state for pagination and season
  const [pageIndex, setPageIndex] = React.useState(0);
  const [season, setSeason] = React.useState('2025'); // Set 2025 as default
  
  // Update usePlayers with pagination
  const { data: playersData, isLoading: isLoadingPlayers } = usePlayers({
    season,
    start: pageIndex * 25, // 25 players per page
    count: 25
  });

  // Add global rank to each player for proper sorting across pages
  const players = React.useMemo(() => {
    if (!playersData) return [];
    return playersData.map((player, index) => ({
      ...player,
      globalRank: pageIndex * 25 + index + 1
    }));
  }, [playersData, pageIndex]);

  // Reset page when season changes
  React.useEffect(() => {
    setPageIndex(0);
  }, [season]);

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
              className="cursor-pointer w-full bg-[#7d2eff] py-3"
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
    <>
      <header className="flex justify-between items-center p-4">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={userImageUrl || ''} alt="User Profile" />
            <AvatarFallback>{userName?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold">Welcome, {userName || 'User'}</h1>
        </div>
        <div className="flex items-center space-x-3">
            <a
              href={`${userProfileUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7d2eff] hover:underline"
            >
              View Profile
            </a>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </header>
      <main className="p-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold">MLB Players - {season} Season</h2>
          <select 
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="border rounded p-2 bg-white"
          >
            {[2025, 2024, 2023, 2022].map((year) => (
              <option key={year} value={year.toString()}>{year}</option>
            ))}
          </select>
        </div>
        <DataTable 
          columns={columns} 
          data={players || []} 
          isLoading={isLoadingPlayers}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          totalPages={4} // This is hardcoded for now, ideally should come from API
        />
      </main>
    </>
  );
}
