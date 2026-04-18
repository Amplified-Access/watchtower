"use client";

import { useState } from "react";
import { trpc } from "@/_trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Upload,
  Plus,
  Edit,
  Trash2,
  Download,
  Eye,
  EyeOff,
  FileText,
  Database,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Loader from "@/components/common/loader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  datasetUploadSchema,
  datasetUpdateSchema,
  type DatasetUpload,
  type DatasetUpdate,
} from "@/features/datasets/schemas/dataset-schema";
import Container from "@/components/common/container";

const SuperAdminDatasetsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDataset, setEditingDataset] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Queries
  const {
    data: datasetsData,
    isLoading,
    refetch,
  } = trpc.getAllDatasets.useQuery({
    search: searchTerm || undefined,
    category: selectedCategory === "all" ? undefined : selectedCategory,
    page: currentPage,
    limit: 10,
    includePrivate: true,
  });

  const { data: categories } = trpc.getDatasetCategories.useQuery();

  // Mutations
  const uploadDatasetMutation = trpc.uploadDataset.useMutation({
    onSuccess: () => {
      toast.success("Dataset uploaded successfully!");
      setIsUploadDialogOpen(false);
      refetch();
      reset();
      setUploadFile(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload dataset");
    },
  });

  const updateDatasetMutation = trpc.updateDataset.useMutation({
    onSuccess: () => {
      toast.success("Dataset updated successfully!");
      setIsEditDialogOpen(false);
      setEditingDataset(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update dataset");
    },
  });

  const deleteDatasetMutation = trpc.deleteDataset.useMutation({
    onSuccess: () => {
      toast.success("Dataset deleted successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete dataset");
    },
  });

  // Form setup for upload
  const form = useForm<DatasetUpload>({
    resolver: zodResolver(datasetUploadSchema as any),
    defaultValues: {
      license: "CC BY 4.0",
      version: "1.0",
      isPublic: true,
      tags: [],
      keywords: [],
    },
  });

  // Form setup for edit
  const editForm = useForm<DatasetUpdate>({
    resolver: zodResolver(datasetUpdateSchema as any),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = form;

  const onSubmit = async (data: DatasetUpload) => {
    if (!uploadFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    try {
      // Upload file to CloudFlare R2
      const formData = new FormData();
      formData.append("file", uploadFile);

      const response = await fetch("/api/file-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("File upload failed");
      }

      const { fileKey } = await response.json();

      // Create dataset record
      await uploadDatasetMutation.mutateAsync({
        ...data,
        fileKey,
        fileName: uploadFile.name,
        fileSize: uploadFile.size,
        fileType: uploadFile.type,
      });
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const onEditSubmit = async (data: DatasetUpdate) => {
    try {
      await updateDatasetMutation.mutateAsync(data);
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Update failed. Please try again.");
    }
  };

  const handleEdit = (dataset: any) => {
    setEditingDataset(dataset);
    // Populate the edit form with current dataset data
    editForm.reset({
      id: dataset.id,
      title: dataset.title,
      description: dataset.description,
      category: dataset.category,
      tags: dataset.tags || [],
      source: dataset.source || "",
      license: dataset.license,
      version: dataset.version,
      coverage: dataset.coverage || "",
      format: dataset.format,
      keywords: dataset.keywords || [],
      methodology: dataset.methodology || "",
      isPublic: dataset.isPublic,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to delete this dataset? This action cannot be undone."
      )
    ) {
      await deleteDatasetMutation.mutateAsync({ id });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case "csv":
        return <FileText className="h-4 w-4 text-green-600" />;
      case "json":
        return <Database className="h-4 w-4 text-blue-600" />;
      case "excel":
      case "xlsx":
        return <FileText className="h-4 w-4 text-emerald-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Container className="p-6" size="lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold font-title pb-4">
            Dataset Management
          </h1>
          <p className="text-gray-600">Manage and publish open datasets</p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload Dataset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload New Dataset</DialogTitle>
              <DialogDescription>
                Upload a new dataset to the open data repository
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="Dataset title"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    onValueChange={(value) => setValue("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TFGBV">
                        Technology Facilitated Gender Based Violence
                      </SelectItem>
                      <SelectItem value="Human-Rights">Human Rights</SelectItem>
                      <SelectItem value="Civic-Participation">
                        Civic Participation
                      </SelectItem>
                      <SelectItem value="Good-Governance">
                        Good Governance
                      </SelectItem>
                      <SelectItem value="Public-Safety">
                        Public Safety
                      </SelectItem>
                      <SelectItem value="Digital-Access">
                        Digital Access
                      </SelectItem>
                      <SelectItem value="Disinformation">
                        Disinformation
                      </SelectItem>
                      <SelectItem value="Conflict">Conflict</SelectItem>
                      <SelectItem value="Environment">Environment</SelectItem>
                      <SelectItem value="Health">Health</SelectItem>
                      <SelectItem value="Infrastructure">
                        Infrastructure
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.category.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Describe the dataset, its contents, and potential uses"
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    {...register("source")}
                    placeholder="Data source or provider"
                  />
                </div>
                <div>
                  <Label htmlFor="format">Format *</Label>
                  <Select onValueChange={(value) => setValue("format", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CSV">CSV</SelectItem>
                      <SelectItem value="JSON">JSON</SelectItem>
                      <SelectItem value="Excel">Excel</SelectItem>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="XML">XML</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.format && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.format.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="license">License</Label>
                  <Input
                    id="license"
                    {...register("license")}
                    placeholder="CC BY 4.0"
                  />
                </div>
                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    {...register("version")}
                    placeholder="1.0"
                  />
                </div>
                <div>
                  <Label htmlFor="coverage">Coverage</Label>
                  <Input
                    id="coverage"
                    {...register("coverage")}
                    placeholder="Geographic or temporal coverage"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="methodology">Methodology</Label>
                <Textarea
                  id="methodology"
                  {...register("methodology")}
                  placeholder="How was this data collected or generated?"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="file">File *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  accept=".csv,.json,.xlsx,.xls,.pdf,.xml"
                />
                {uploadFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {uploadFile.name} (
                    {formatFileSize(uploadFile.size)})
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  onCheckedChange={(checked) => setValue("isPublic", checked)}
                  defaultChecked={true}
                />
                <Label htmlFor="isPublic">Make dataset public</Label>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader className="mr-2" size="16" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Dataset
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dataset Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Dataset</DialogTitle>
              <DialogDescription>
                Update the dataset information
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input
                    id="edit-title"
                    {...editForm.register("title")}
                    placeholder="Dataset title"
                  />
                  {editForm.formState.errors.title && (
                    <p className="text-sm text-red-600 mt-1">
                      {editForm.formState.errors.title.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-category">Category *</Label>
                  <Select
                    value={editForm.watch("category") || ""}
                    onValueChange={(value) =>
                      editForm.setValue("category", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TFGBV">
                        Technology Facilitated Gender Based Violence
                      </SelectItem>
                      <SelectItem value="Human-Rights">Human Rights</SelectItem>
                      <SelectItem value="Civic-Participation">
                        Civic Participation
                      </SelectItem>
                      <SelectItem value="Good-Governance">
                        Good Governance
                      </SelectItem>
                      <SelectItem value="Public-Safety">
                        Public Safety
                      </SelectItem>
                      <SelectItem value="Digital-Access">
                        Digital Access
                      </SelectItem>
                      <SelectItem value="Disinformation">
                        Disinformation
                      </SelectItem>
                      <SelectItem value="Conflict">Conflict</SelectItem>
                      <SelectItem value="Environment">Environment</SelectItem>
                      <SelectItem value="Health">Health</SelectItem>
                      <SelectItem value="Infrastructure">
                        Infrastructure
                      </SelectItem>
                      <SelectItem value="Economic">Economic</SelectItem>
                      <SelectItem value="Social">Social</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {editForm.formState.errors.category && (
                    <p className="text-sm text-red-600 mt-1">
                      {editForm.formState.errors.category.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  {...editForm.register("description")}
                  placeholder="Dataset description"
                  rows={3}
                />
                {editForm.formState.errors.description && (
                  <p className="text-sm text-red-600 mt-1">
                    {editForm.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-source">Source</Label>
                  <Input
                    id="edit-source"
                    {...editForm.register("source")}
                    placeholder="Data source"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-license">License *</Label>
                  <Select
                    value={editForm.watch("license") || ""}
                    onValueChange={(value) =>
                      editForm.setValue("license", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select license" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CC BY 4.0">CC BY 4.0</SelectItem>
                      <SelectItem value="CC BY-SA 4.0">CC BY-SA 4.0</SelectItem>
                      <SelectItem value="CC BY-NC 4.0">CC BY-NC 4.0</SelectItem>
                      <SelectItem value="Public Domain">
                        Public Domain
                      </SelectItem>
                      <SelectItem value="MIT">MIT</SelectItem>
                      <SelectItem value="GPL">GPL</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-version">Version *</Label>
                  <Input
                    id="edit-version"
                    {...editForm.register("version")}
                    placeholder="e.g., 1.0, 2.1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-coverage">Coverage</Label>
                  <Input
                    id="edit-coverage"
                    {...editForm.register("coverage")}
                    placeholder="Geographic or temporal coverage"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-methodology">Methodology</Label>
                <Textarea
                  id="edit-methodology"
                  {...editForm.register("methodology")}
                  placeholder="Data collection methodology"
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-public"
                  checked={editForm.watch("isPublic") || false}
                  onCheckedChange={(checked) =>
                    editForm.setValue("isPublic", checked)
                  }
                />
                <Label htmlFor="edit-public">Make dataset public</Label>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateDatasetMutation.isPending}
                >
                  {updateDatasetMutation.isPending ? (
                    <>
                      <Loader className="mr-2 h-4 w-4" />
                      Updating...
                    </>
                  ) : (
                    "Update Dataset"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search datasets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((category) => (
              <SelectItem key={category.category} value={category.category}>
                {category.category} ({category.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Datasets List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="text-blue-600" size="32" />
        </div>
      ) : (
        <div className="space-y-4">
          {datasetsData?.data.map((dataset) => (
            <Card key={dataset.id} className="shadow-none rounded-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{dataset.title}</CardTitle>
                      {dataset.isPublic ? (
                        <span title="Public">
                          <Eye className="h-4 w-4 text-green-600" />
                        </span>
                      ) : (
                        <span title="Private">
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        </span>
                      )}
                    </div>
                    <CardDescription className="mb-3">
                      {dataset.description}
                    </CardDescription>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{dataset.category}</Badge>
                      <Badge variant="outline">{dataset.format}</Badge>
                      <Badge variant="outline">
                        {formatFileSize(dataset.fileSize)}
                      </Badge>
                      <Badge variant="outline">
                        {dataset.downloadCount} downloads
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {getFormatIcon(dataset.format)}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(dataset)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(dataset.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
};

export default SuperAdminDatasetsPage;
