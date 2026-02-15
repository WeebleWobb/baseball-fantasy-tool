'use client';

import { useYahooFantasy } from "@/hooks/use-yahoo-fantasy";
import { AuthGuard } from "@/components/auth-guard";
import { AppHeader } from "@/components/app-header";
import { PageHeader } from "@/components/page-header";
import { extractUserProfile } from "@/lib/user-profile";

export default function DraftListPage() {
  const { useUserInfo } = useYahooFantasy();
  const { data: userInfo } = useUserInfo();
  const userProfile = extractUserProfile(userInfo);

  return (
    <AuthGuard>
      <AppHeader userProfile={userProfile} />
      <main className="p-8">
        <PageHeader
          title="Draft List Builder"
          subtitle="Build your fantasy baseball draft list by adding players from the available pool"
        />
        {/* Phase 3: DraftListBuilder component will be added here */}
      </main>
    </AuthGuard>
  );
}
