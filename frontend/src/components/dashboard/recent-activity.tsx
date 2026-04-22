"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, Clock, Users } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: string; // Changed to string to match backend
  status?: string;
  href?: string;
}


interface RecentActivityProps {
  activities: ActivityItem[];
  title?: string;
  className?: string;
}

export function RecentActivity({
  activities = [],
  title = "Recent Activity",
  className,
}: RecentActivityProps) {
  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "incident":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "report":
        return <Eye className="h-4 w-4 text-blue-500" />;
      case "form":
        return <Calendar className="h-4 w-4 text-green-500" />;
      case "application":
        return <Users className="h-4 w-4 text-purple-500" />;
      case "admin":
        return <Users className="h-4 w-4 text-red-500" />;
      case "watcher":
        return <Users className="h-4 w-4 text-cyan-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "resolved":
      case "published":
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "investigating":
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "reported":
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "closed":
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card className={cn("shadow-none rounded-md h-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-title">{title}</CardTitle>
      </CardHeader>
      <CardContent className="">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
            <Link
              href={activity.href || ""}
              key={activity.id}
              className="flex items-start space-x-3 border-b px-4 py-4 first:border-t hover:bg-muted"
            >
              {/* <div className="flex-shrink-0 mt-1">
              {getActivityIcon(activity.type)}
              </div> */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-base font-medium truncate">
                    {activity.title}
                  </p>
                  <div className="flex items-center space-x-2">
                    {/* {activity.status && (
                      <Badge
                        variant="outline"
                        className={getStatusColor(activity.status)}
                      >
                        {activity.status}
                      </Badge>
                    )} */}
                    {/* {activity.href && (
                      <Button asChild size="sm" variant="ghost">
                        <Link href={activity.href}>
                          <Eye className="h-3 w-3" />
                        </Link>
                      </Button>
                    )} */}
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground/80">
                  {activity.description}
                </p>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
