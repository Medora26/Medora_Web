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
  const { user } = useAuth();
  const router = useRouter();

  const [files, setFiles] = useState<any[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // fetch recent
useEffect(() => {
  if (!user?.uid) return;

  const fetchRecent = async () => {
    try {
      setLoading(true);

      const docs = await getRecentUploads(user.uid, 50);

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
}, [user?.uid]);
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

  const handleDownload = (url: string) => {
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

        {/* rest of your grid + list layout stays EXACTLY SAME */}
      </div>
    </DashboardLayout>
  );
};

export default Page;