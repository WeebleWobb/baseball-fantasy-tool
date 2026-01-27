import type { UsersResponse } from '@/lib/schemas/users';
import type { UserProfile } from '@/types/user-profile';

interface YahooProfile {
  display_name?: string;
  fantasy_profile_url?: string;
  image_url?: string;
}

/**
 * Extracts user profile from Yahoo's nested API response structure.
 * Users collection uses numeric string keys ("0", "1"), not array indices.
 */
export function extractUserProfile(userInfo: UsersResponse | undefined): UserProfile {
  const firstUser = userInfo?.fantasy_content?.users?.["0"];
  if (typeof firstUser === 'number') return {};

  const profileEntry = firstUser?.user?.[1];
  const profile = (profileEntry && 'profile' in profileEntry ? profileEntry.profile : undefined) as YahooProfile | undefined;

  return {
    displayName: profile?.display_name,
    profileUrl: profile?.fantasy_profile_url,
    imageUrl: profile?.image_url,
  };
}
