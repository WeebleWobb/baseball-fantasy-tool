'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>
            There was a problem signing you in.
            {error && (
              <p className="mt-2 text-red-600">
                Error: {error}
              </p>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full"
            onClick={() => router.push('/auth/signin')}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Authentication Error</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
} 