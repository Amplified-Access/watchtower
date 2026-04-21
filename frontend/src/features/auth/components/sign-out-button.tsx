"use client";

import Loader from "@/components/common/loader";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";

const SignOutButton = ({ className }: { className?: string }) => {
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);
  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
         window.location.reload(); // redirect to login page
        },
      },
    });
  };
  return (
    <Button onClick={handleSignOut} className={className}>
      {isSigningOut ? <Loader /> : <span>Sign out</span>}
    </Button>
  );
};

export default SignOutButton;
