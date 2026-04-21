import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function NoOrganizationPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle className="text-xl">No Organization Associated</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-4">
            Your account is not currently associated with any organization.
            Please contact your system administrator to be assigned to an
            organization.
          </p>
          <p className="text-sm text-gray-500">
            You need to be part of an organization to access the WatchTower
            platform.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
