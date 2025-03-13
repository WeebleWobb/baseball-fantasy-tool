'use client';

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Welcome to Fantasy Baseball Tool</CardTitle>
          <CardDescription>
            Sign in with your Yahoo account to access your fantasy baseball data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full"
            onClick={() => signIn('yahoo', { callbackUrl: '/' })}
          >
            Sign in with Yahoo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 