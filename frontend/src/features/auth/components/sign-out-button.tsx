"use client";

import Loader from "@/components/common/loader";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

const SignOutButton = ({ className }: { className?: string }) => {
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      window.location.href = "/sign-in";
    }
  };

  return (
    <Button onClick={handleSignOut} className={className}>
      {isSigningOut ? <Loader /> : <span>Sign out</span>}
    </Button>
  );
};

export default SignOutButton;
