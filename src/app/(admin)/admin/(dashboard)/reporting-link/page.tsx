"use client";

import { Button } from "@/components/ui/button";
import { Clipboard, Check } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

const REPORT_LINK = `${
  typeof window !== "undefined" ? window.location.origin : ""
}/anonymous-reports`;

const Page = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(REPORT_LINK).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, []);

  return (
    <div className="border grid place-items-center h-full">
      <div className="flex flex-col items-center gap-4">
        <p>
          Anyone outside the organization can send reports through this link
        </p>
        <div className="flex">
          <Button onClick={handleCopy} size={"lg"}>
            {copied ? (
              <p className="flex items-center gap-2">
                <span>Copied to clipboard</span>
                <Check />
              </p>
            ) : (
              <p className="flex items-center gap-2">
                <span>Copy link to clipboard</span>
                <Clipboard />
              </p>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Page;
