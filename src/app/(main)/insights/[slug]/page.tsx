"use client";

import React, { useState } from "react";
import { trpc } from "@/_trpc/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Building,
  User,
  ArrowLeft,
  Share2,
  Tag,
  Eye,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";

function formatRelativeTime(date: string | Date) {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function formatReadingTime(content: any) {
  if (!content) return "1 min read";

  // Rough estimate: 200 words per minute reading speed
  const wordsPerMinute = 200;
  let wordCount = 0;

  if (Array.isArray(content)) {
    wordCount = content.reduce((count, block) => {
      if (block.children) {
        return (
          count +
          block.children.reduce((childCount: number, child: any) => {
            return childCount + (child.text ? child.text.split(" ").length : 0);
          }, 0)
        );
      }
      return count;
    }, 0);
  }

  const readingTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  return `${readingTime} min read`;
}

function renderContent(content: any) {
  if (!content || !Array.isArray(content)) {
    return <p className="text-muted-foreground">No content available.</p>;
  }

  return content.map((block, index) => {
    if (block._type === "block") {
      const style = block.style || "normal";

      const text =
        block.children?.map((child: any, childIndex: number) => {
          let element = child.text || "";

          if (child.marks?.includes("strong")) {
            element = <strong key={childIndex}>{element}</strong>;
          }
          if (child.marks?.includes("em")) {
            element = <em key={childIndex}>{element}</em>;
          }

          return element;
        }) || [];

      switch (style) {
        case "h1":
          return (
            <h1 key={index} className="text-3xl font-bold mb-4">
              {text}
            </h1>
          );
        case "h2":
          return (
            <h2 key={index} className="text-2xl font-semibold mb-3">
              {text}
            </h2>
          );
        case "h3":
          return (
            <h3 key={index} className="text-xl font-semibold mb-2">
              {text}
            </h3>
          );
        case "h4":
          return (
            <h4 key={index} className="text-lg font-semibold mb-2">
              {text}
            </h4>
          );
        case "blockquote":
          return (
            <blockquote
              key={index}
              className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground"
            >
              {text}
            </blockquote>
          );
        default:
          return (
            <p key={index} className="mb-4 leading-relaxed">
              {text}
            </p>
          );
      }
    }

    return null;
  });
}

export default function InsightDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState<string>("");

  // Handle async params
  React.useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setSlug(resolvedParams.slug);
    };
    getParams();
  }, [params]);

  const {
    data: insight,
    isLoading,
    error,
  } = trpc.getPublicInsightBySlug.useQuery(
    {
      slug,
    },
    {
      enabled: !!slug,
    }
  );

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: insight?.title,
          text: insight?.description,
          url: window.location.href,
        });
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-10 w-32 mb-6" />

        <Card>
          <div className="aspect-video">
            <Skeleton className="w-full h-full rounded-t-lg" />
          </div>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <Eye className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Insight not found</h3>
              <p>
                The insight you're looking for could not be found or may have
                been removed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!insight) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Insights
      </Button>

      {/* Main Content */}
      <article>
        {/* Hero Image */}
        {insight.imageUrl && (
          <div className="aspect-video rounded-lg overflow-hidden mb-8">
            <img
              src={insight.imageUrl}
              alt={insight.imageAlt || insight.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-4">{insight.title}</CardTitle>

                <p className="text-lg text-muted-foreground mb-6">
                  {insight.description}
                </p>

                {/* Tags */}
                {insight.tags && insight.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {insight.tags.map((tag) => (
                      <Badge key={tag.id} variant="secondary">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag.title}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Meta Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  {insight.authorName && (
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <span className="font-medium">By:</span>
                      <span className="ml-1">{insight.authorName}</span>
                    </div>
                  )}

                  {insight.organizationName && (
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      <span className="font-medium">Organization:</span>
                      <span className="ml-1">{insight.organizationName}</span>
                    </div>
                  )}

                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="font-medium">Published:</span>
                    <span className="ml-1">
                      {formatRelativeTime(
                        insight.publishedAt || insight.createdAt
                      )}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="font-medium">Reading time:</span>
                    <span className="ml-1">
                      {formatReadingTime(insight.content)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="ml-4"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Content */}
        <Card>
          <CardContent className="pt-6">
            <div className="prose prose-gray max-w-none">
              {renderContent(insight.content)}
            </div>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Button
              variant="outline"
              onClick={() => router.push("/insights")}
              className="flex-1 sm:flex-initial"
            >
              Browse More Insights
            </Button>
            <Button onClick={handleShare} className="flex-1 sm:flex-initial">
              <Share2 className="h-4 w-4 mr-2" />
              Share This Insight
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
}
