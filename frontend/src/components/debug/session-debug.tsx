"use client";

import { authClient } from "@/lib/auth-client";

export function SessionDebug() {
  const { data: session } = authClient.useSession();

  if (!session) {
    return <div>No session</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="font-bold mb-2">Session Debug:</h3>
      <pre className="text-xs overflow-auto">
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  );
}
