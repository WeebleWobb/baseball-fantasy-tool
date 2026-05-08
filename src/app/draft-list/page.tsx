'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { useYahooFantasy } from "@/hooks/use-yahoo-fantasy";
import { AuthGuard } from "@/components/auth-guard";
import { AppHeader } from "@/components/app-header";
import { PageHeader } from "@/components/page-header";
import { DraftListBuilder } from "@/components/draft-list";
import { Button } from "@/components/ui/button";
import { extractUserProfile } from "@/lib/user-profile";

export default function DraftListPage() {
  const [importSheetOpen, setImportSheetOpen] = useState(false);
  const { useUserInfo } = useYahooFantasy();
  const { data: userInfo } = useUserInfo();
  const userProfile = extractUserProfile(userInfo);

  const importButton = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setImportSheetOpen(true)}
    >
      <Upload className="h-4 w-4" />
      Import CSV
    </Button>
  );

  return (
    <AuthGuard>
      <AppHeader userProfile={userProfile} />
      <main className="p-8">
        <PageHeader
          title="Draft List Builder"
          subtitle="Build your fantasy baseball draft list by adding players from the available pool"
          rightContent={importButton}
        />
        <DraftListBuilder
          importSheetOpen={importSheetOpen}
          onImportSheetOpenChange={setImportSheetOpen}
        />
      </main>
    </AuthGuard>
  );
}
