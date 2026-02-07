'use client';

import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Icon, ListTodo, User, DoorClosed } from 'lucide-react';
import { baseball } from '@lucide/lab';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { NavButton } from './nav-button';
import type { UserProfile } from '@/types/user-profile';

interface AppHeaderProps {
  userProfile: UserProfile;
}

export function AppHeader({ userProfile }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = () => {
    signOut({ redirect: true, callbackUrl: '/' });
  };

  return (
    <header className="flex justify-between items-center px-6 py-4 border-b">
      {/* Left side: Avatar + Welcome */}
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={userProfile.imageUrl || ''} alt="User Profile" />
          <AvatarFallback className="bg-[#7d2eff] text-white font-semibold">
            {userProfile.displayName?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <span className="text-lg font-semibold">
          Welcome, {userProfile.displayName || 'User'}
        </span>
      </div>

      {/* Right side: Navigation */}
      <nav className="flex items-center gap-0.5">
        <NavButton
          icon={<Icon iconNode={baseball} className="h-4 w-4" />}
          label="Players"
          onClick={() => router.push('/')}
          isActive={pathname === '/'}
        />
        <NavButton
          icon={<ListTodo className="h-4 w-4" />}
          label="Draft List"
          disabled
        />
        <Separator orientation="vertical" className="h-6 mx-0.5" />
        <NavButton
          icon={<User className="h-4 w-4" />}
          label="Profile"
          href={userProfile.profileUrl || '#'}
          external
        />
        <NavButton
          icon={<DoorClosed className="h-4 w-4" />}
          label="Sign Out"
          onClick={handleSignOut}
        />
      </nav>
    </header>
  );
}
