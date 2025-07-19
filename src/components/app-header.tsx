'use client';

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserProfile {
  displayName?: string;
  profileUrl?: string;
  imageUrl?: string;
}

interface AppHeaderProps {
  userProfile: UserProfile;
}

export function AppHeader({ userProfile }: AppHeaderProps) {
  const handleSignOut = () => {
    signOut({ redirect: true, callbackUrl: "/" });
  };

  return (
    <header className="flex justify-between items-center p-4">
      <div className="flex items-center gap-2">
        <Avatar>
          <AvatarImage src={userProfile.imageUrl || ''} alt="User Profile" />
          <AvatarFallback>
            {userProfile.displayName?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold">
          Welcome, {userProfile.displayName || 'User'}
        </h1>
      </div>
      <div className="flex items-center space-x-3">
        <a
          href={userProfile.profileUrl || '#'}
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
  );
} 