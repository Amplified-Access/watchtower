"use client";

import { useState } from "react";
import { trpc } from "@/_trpc/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Calendar,
  Building,
  User,
  Tag,
  Eye,
  TrendingUp,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export default function InsightsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 12;

  // Fetch insights
  const {
    data: insights,
    isLoading: insightsLoading,
    error: insightsError,
  } = trpc.getPublicInsights.useQuery({
    limit: pageSize,
    offset: currentPage * pageSize,
    search: searchTerm || undefined,
    tagId: selectedTag && selectedTag !== "all" ? selectedTag : undefined,
  });

  // Fetch tags for filtering
  const { data: tags, isLoading: tagsLoading } = trpc.getInsightTags.useQuery();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0); // Reset to first page when searching
  };

  const handleTagFilter = (tagId: string) => {
    setSelectedTag(tagId);
    setCurrentPage(0); // Reset to first page when filtering
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Insights & Learnings
        </h1>
        <p className="text-muted-foreground">
          Stay informed with the latest insights on civic technology, digital
          rights, and social change initiatives across the region.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search insights by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Category</label>
              <Select value={selectedTag} onValueChange={handleTagFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {tags?.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      {tag.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{insights?.length || 0}</p>
                <p className="text-xs text-muted-foreground">
                  Current insights
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Tag className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{tags?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">Live</p>
                <p className="text-xs text-muted-foreground">
                  Real-time updates
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {insightsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <div className="aspect-video">
                <Skeleton className="w-full h-full rounded-t-lg" />
              </div>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {insightsError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p>Failed to load insights. Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights Grid */}
      {insights && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {insights.map((insight) => (
              <Card
                key={insight.id}
                className="hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Image */}
                {insight.imageUrl && (
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={insight.imageUrl}
                      alt={insight.imageAlt || insight.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 mb-2">
                        {insight.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                        {insight.description}
                      </p>
                      <div className="space-y-1">
                        {insight.organizationName && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Building className="h-3 w-3 mr-1" />
                            {insight.organizationName}
                          </div>
                        )}
                        {insight.authorName && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <User className="h-3 w-3 mr-1" />
                            {insight.authorName}
                          </div>
                        )}
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatRelativeTime(
                            insight.publishedAt || insight.createdAt
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <Button
                    variant="outline"
                    onClick={() =>
                      (window.location.href = `/insights/${insight.slug}`)
                    }
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Read More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              Page {currentPage + 1}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={!insights || insights.length < pageSize}
            >
              Next
            </Button>
          </div>
        </>
      )}

      {/* Empty State */}
      {insights && insights.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No insights found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedTag
                  ? "No insights match your search criteria."
                  : "There are no published insights available at this time."}
              </p>
              {(searchTerm || selectedTag) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedTag("");
                    setCurrentPage(0);
                  }}
                  className="mt-4"
                >
                  Clear filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
