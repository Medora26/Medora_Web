"use client";

import DashboardLayout from "@/components/layouts/dashboard/dashboard-layout";
import { useAuth } from "@/context/auth/authContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getRecentUploads,
  toggleDocumentStarred,
  trashDocument,
} from "@/lib/firebase/service/uploadFile/service";

import {
  Loader2,
  Grid,
  List,
  ChevronDown,
  X,
  Star,
  MoreVertical,
  Download,
  Share2,
  Trash2,
  Eye,
  Image as ImageIcon,
  Copy,
  Edit,
  FolderOpen,
  Upload,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import Image from "next/image";
import { toast } from "sonner";


// helpers
const formatBytes = (bytes: number, decimals = 2) => {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return "--";
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "--";
  }
};

const Page = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [files, setFiles] = useState<any[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // fetch recent
useEffect(() => {
  if (authLoading) return;   // wait until auth finishes
  if (!user?.uid) return;

  const fetchRecent = async () => {
    try {
      setLoading(true);

      const docs = await getRecentUploads(user.uid, 50);

      console.log("Recent docs:", docs); // DEBUG

      setFiles(docs);
      setFilteredFiles(docs);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load recent files");
    } finally {
      setLoading(false);
    }
  };

  fetchRecent();
}, [user?.uid, authLoading]);
  // filtering + sorting
  useEffect(() => {
    let updated = [...files];

    if (typeFilter !== "all") {
      updated = updated.filter(
        (file) =>
          file.category?.toLowerCase() === typeFilter ||
          file.categoryLabel?.toLowerCase() === typeFilter
      );
    }

    if (sortBy === "recent") {
      updated.sort((a, b) => {
        const dateA = a.uploadedAt?.toDate?.() || new Date(0);
        const dateB = b.uploadedAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
    }

    if (sortBy === "oldest") {
      updated.sort((a, b) => {
        const dateA = a.uploadedAt?.toDate?.() || new Date(0);
        const dateB = b.uploadedAt?.toDate?.() || new Date(0);
        return dateA - dateB;
      });
    }

    if (sortBy === "name") {
      updated.sort((a, b) =>
        (a.documentName || "").localeCompare(b.documentName || "")
      );
    }

    setFilteredFiles(updated);
  }, [files, typeFilter, sortBy]);

  // handlers
  const handleViewFile = (fileId: string) => {
    router.push(`/dashboard/view/${fileId}`);
  };

  const handleDownload = (url: string, documentName: any) => {
    window.open(url, "_blank");
  };

  const handleShare = (fileId: string) => {
    router.push(`/dashboard/share/${fileId}`);
  };

  const handleMoveToTrash = async (fileId: string) => {
    await trashDocument(fileId);
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleStarToggle = async (fileId: string, current: boolean) => {
    await toggleDocumentStarred(fileId, !current);
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, isStarred: !current } : f))
    );
  };

  const typeLabel =
    typeFilter === "all" ? "Type" : typeFilter.toUpperCase();

  const sortLabel =
    sortBy === "recent"
      ? "Modified"
      : sortBy === "oldest"
      ? "Oldest"
      : "Name";

  function setSearchTerm(arg0: string) {
    throw new Error("Function not implemented.");
  }

  function setStarredFilter(arg0: boolean) {
    throw new Error("Function not implemented.");
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">

        {/* header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Recent</h1>
          <p className="text-muted-foreground">
            Files you recently uploaded or accessed
          </p>
        </div>

        {/* controls */}
        <div className="flex items-center justify-between">

          {/* filters */}
          <div className="flex items-center gap-3">

            {/* type */}
            <DropdownMenu>
              <div className="flex items-center border rounded-md overflow-hidden">
                <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 text-sm">
                  {typeLabel}
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>

                {typeFilter !== "all" && (
                  <button
                    onClick={() => setTypeFilter("all")}
                    className="px-2 py-2 border-l"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setTypeFilter("all")}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("xray")}>X-Ray</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("mri")}>MRI</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("ct")}>CT</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("ultrasound")}>Ultrasound</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("mammogram")}>Mammograms</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* sort */}
            <DropdownMenu>
              <div className="flex items-center border rounded-md overflow-hidden">
                <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 text-sm">
                  {sortLabel}
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>

                {sortBy !== "recent" && (
                  <button
                    onClick={() => setSortBy("recent")}
                    className="px-2 py-2 border-l"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy("recent")}>Recently added</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")}>Oldest first</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name")}>Name</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* view toggle */}
          <TooltipProvider>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 border rounded-md ${viewMode === "grid" ? "bg-accent" : ""}`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Grid layout</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 border rounded-md ${viewMode === "list" ? "bg-accent" : ""}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>List layout</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        

      
       {/* Grid View - Fix */}
      {!loading && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="group overflow-hidden  hover:shadow-lg transition-all py-0 ">
              {/* Thumbnail Area */}
              <div className="aspect-square relative">
                {file.cloudinary?.thumbnailUrl || file.cloudinary?.url ? (
                  <div className="relative w-full h-full ">
                    <Image 
                      fill
                      src={file.cloudinary.thumbnailUrl || file.cloudinary.url}
                      alt={file.documentName}
                      
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  </div>
                )}
                
                {/* Study Type Badge */}
                <div className="absolute top-2 left-2 z-10">
                  <span className="bg-background/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full shadow-sm">
                    {file.categoryLabel || file.category}
                  </span>
                </div>
                
                {/* Star Indicator */}
                {file.isStarred && (
                  <div className="absolute top-2 right-2 z-10">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                )}
      
                {/* Action Menu */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/90 backdrop-blur-sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleViewFile(file.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(file.cloudinary?.url, file.documentName)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare(file.id)}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStarToggle(file.id, file.isStarred)}>
                        <Star className="h-4 w-4 mr-2" />
                        {file.isStarred ? 'Remove Star' : 'Add Star'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleMoveToTrash(file.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Move to Trash
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
      
              {/* File Info */}
              <CardContent className="pb-4 px-5">
                <div className="space-y-1">
                  <h3 className="font-medium text-sm line-clamp-1" title={file.documentName}>
                    {file.documentName || 'Untitled'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(file.uploadedAt)}</span>
                    <span>•</span>
                    <span>{formatBytes(file.cloudinary?.bytes || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* List View - Fix */}
      {!loading && viewMode === 'list' && (
        <Card>
          <div className="divide-y">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-muted-foreground bg-muted/50">
              <div className="col-span-5">Name</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-1">Actions</div>
            </div>
      
            {/* Table Rows */}
            {filteredFiles.map((file) => (
              <div key={file.id} className="grid grid-cols-12 gap-4 p-4 text-sm items-center hover:bg-accent/50 transition-colors group">
                <div className="col-span-5 flex items-center gap-3">
                  <div className="h-8 w-8 bg-muted rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                    {file.cloudinary?.thumbnailUrl ? (
                      <div className="relative w-full h-full">
                        <Image 
                         fill
                          src={file.cloudinary.thumbnailUrl}
                          alt={file.documentName}
                          
                          className="object-cover"
                          sizes="32px"
                        />
                      </div>
                    ) : (
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.documentName || 'Untitled'}</p>
                  </div>
                  {file.isStarred && (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                  )}
                </div>
                <div className="col-span-2">
                  <span className="px-2 py-1 bg-muted rounded-full text-xs">
                    {file.categoryLabel || file.category}
                  </span>
                </div>
                <div className="col-span-2 text-muted-foreground">{formatDate(file.uploadedAt)}</div>
                <div className="col-span-2 text-muted-foreground">{formatBytes(file.cloudinary?.bytes || 0)}</div>
                <div className="col-span-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleViewFile(file.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(file.cloudinary?.url, file.documentName)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare(file.id)}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleMoveToTrash(file.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      
              {/* Empty State */}
              {!loading && filteredFiles.length === 0 && (
                <Card className="py-12">
                  <CardContent className="flex flex-col items-center justify-center text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <FolderOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {files.length === 0 ? 'No files yet' : 'No matching files'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-md">
                      {files.length === 0 
                        ? 'Upload your first medical image to start organizing your studies.'
                        : 'Try adjusting your search or filters to find what you\'re looking for.'}
                    </p>
                    {files.length === 0 ? (
                      <Button onClick={() => router.push('/dashboard/upload')}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Files
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSearchTerm('')
                          setTypeFilter('all')
                          setStarredFilter(false)
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
    </DashboardLayout>
  );
};

export default Page;