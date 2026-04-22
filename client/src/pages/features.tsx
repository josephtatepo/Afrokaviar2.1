import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "@/lib/theme";
import {
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  CheckCircle2,
  Rocket,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Feature = {
  id: string;
  name: string;
  description: string;
  status: "requested" | "confirmed" | "deployed";
  upvotes: number;
  downvotes: number;
  createdAt: string;
};

type UserVote = { voteType: "upvote" | "downvote" } | null;

function FeatureCard({
  feature,
  userVote,
  isAuthenticated,
  isAdmin,
  onVote,
  onRemoveVote,
  onStatusChange,
  onDelete,
}: {
  feature: Feature;
  userVote: UserVote;
  isAuthenticated: boolean;
  isAdmin: boolean;
  onVote: (id: string, type: "upvote" | "downvote") => void;
  onRemoveVote: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const score = feature.upvotes - feature.downvotes;

  return (
    <div className="relative group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 hover:border-white/20 hover:bg-white/8 transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-base mb-1 leading-snug">{feature.name}</h3>
          <p className={`text-sm text-zinc-400 leading-relaxed ${!expanded && "line-clamp-2"}`}>
            {feature.description}
          </p>
          {feature.description.length > 120 && (
            <button
              className="mt-1 text-xs font-bold text-primary/80 hover:text-primary flex items-center gap-1"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />Show more</>}
            </button>
          )}
        </div>
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className={`text-lg font-black ${score > 0 ? "text-green-400" : score < 0 ? "text-red-400" : "text-zinc-400"}`}>
            {score > 0 ? "+" : ""}{score}
          </span>
          <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">score</span>
        </div>
      </div>

      {feature.status === "requested" && (
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <button
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                userVote?.voteType === "upvote"
                  ? "bg-green-500/20 text-green-400 ring-1 ring-green-500/50"
                  : "bg-white/5 text-zinc-400 hover:bg-green-500/10 hover:text-green-400"
              }`}
              onClick={() => isAuthenticated
                ? userVote?.voteType === "upvote" ? onRemoveVote(feature.id) : onVote(feature.id, "upvote")
                : toast({ title: "Sign in to vote", variant: "destructive" })
              }
              data-testid={`button-upvote-${feature.id}`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              {feature.upvotes}
            </button>
            <button
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                userVote?.voteType === "downvote"
                  ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/50"
                  : "bg-white/5 text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
              }`}
              onClick={() => isAuthenticated
                ? userVote?.voteType === "downvote" ? onRemoveVote(feature.id) : onVote(feature.id, "downvote")
                : toast({ title: "Sign in to vote", variant: "destructive" })
              }
              data-testid={`button-downvote-${feature.id}`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              {feature.downvotes}
            </button>
          </div>
          {isAdmin && onStatusChange && (
            <div className="ml-auto flex items-center gap-2">
              <Select value={feature.status} onValueChange={(v) => onStatusChange(feature.id, v)}>
                <SelectTrigger className="h-7 w-28 bg-zinc-900 border-zinc-700 text-white text-xs rounded-full px-3" data-testid={`select-feature-status-${feature.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                  <SelectItem value="requested">Requested</SelectItem>
                  <SelectItem value="confirmed">Coming Soon</SelectItem>
                  <SelectItem value="deployed">Deployed</SelectItem>
                </SelectContent>
              </Select>
              <button
                className="p-1.5 rounded-full text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                onClick={() => onDelete && confirm(`Delete "${feature.name}"?`) && onDelete(feature.id)}
                data-testid={`button-delete-feature-${feature.id}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {feature.status !== "requested" && isAdmin && onStatusChange && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
          <Select value={feature.status} onValueChange={(v) => onStatusChange(feature.id, v)}>
            <SelectTrigger className="h-7 w-28 bg-zinc-900 border-zinc-700 text-white text-xs rounded-full px-3" data-testid={`select-feature-status-${feature.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
              <SelectItem value="requested">Requested</SelectItem>
              <SelectItem value="confirmed">Coming Soon</SelectItem>
              <SelectItem value="deployed">Deployed</SelectItem>
            </SelectContent>
          </Select>
          <button
            className="p-1.5 rounded-full text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            onClick={() => onDelete && confirm(`Delete "${feature.name}"?`) && onDelete(feature.id)}
            data-testid={`button-delete-feature-${feature.id}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function FeaturesPage() {
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data: featuresData = [] } = useQuery<Feature[]>({
    queryKey: ["/api/features"],
    queryFn: async () => {
      const res = await fetch("/api/features");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: adminCheck } = useQuery({
    queryKey: ["/api/me/admin"],
    queryFn: async () => {
      const res = await fetch("/api/me/admin", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: isAuthenticated,
  });
  const isAdmin = !!adminCheck;

  const { data: votesData = {} } = useQuery<Record<string, UserVote>>({
    queryKey: ["/api/features/votes"],
    queryFn: async () => {
      if (!isAuthenticated || !featuresData.length) return {};
      const entries = await Promise.all(
        featuresData.map(async (f) => {
          const res = await fetch(`/api/features/${f.id}/user-vote`, { credentials: "include" });
          const vote = res.ok ? await res.json() : null;
          return [f.id, vote] as [string, UserVote];
        })
      );
      return Object.fromEntries(entries);
    },
    enabled: isAuthenticated && featuresData.length > 0,
  });

  const voteMutation = useMutation({
    mutationFn: async ({ id, voteType }: { id: string; voteType: "upvote" | "downvote" }) => {
      const res = await fetch(`/api/features/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ voteType }),
      });
      if (!res.ok) throw new Error("Failed to vote");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      queryClient.invalidateQueries({ queryKey: ["/api/features/votes"] });
    },
  });

  const removeVoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/features/${id}/vote`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to remove vote");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      queryClient.invalidateQueries({ queryKey: ["/api/features/votes"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/features/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/features"] }),
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/features/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/features"] }),
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      const res = await fetch("/api/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, description, status: "requested" }),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      setNewName("");
      setNewDesc("");
      setShowCreate(false);
      toast({ title: "Feature added!" });
    },
    onError: () => toast({ title: "Failed to create feature", variant: "destructive" }),
  });

  const deployed = featuresData.filter((f) => f.status === "deployed");
  const confirmed = featuresData.filter((f) => f.status === "confirmed");
  const requested = featuresData.filter((f) => f.status === "requested");

  const handleVote = (id: string, voteType: "upvote" | "downvote") => voteMutation.mutate({ id, voteType });
  const handleRemoveVote = (id: string) => removeVoteMutation.mutate(id);
  const handleStatusChange = (id: string, status: string) => statusMutation.mutate({ id, status });
  const handleDelete = (id: string) => deleteMutation.mutate(id);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-black/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </Link>
            <div className="w-px h-5 bg-zinc-800" />
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white">Afrokaviar</span>
              <span className="text-zinc-500 font-bold">·</span>
              <span className="text-zinc-400 font-semibold text-sm">Roadmap</span>
            </div>
          </div>
          {isAdmin && (
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-black text-sm font-bold hover:opacity-90 transition-all"
              onClick={() => setShowCreate(!showCreate)}
              data-testid="button-create-feature"
            >
              <Plus className="w-4 h-4" />
              Add Feature
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-400 font-medium mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            Product Roadmap
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-4">
            Shape the Future of<br />
            <span style={{ color: `var(--color-primary)` }}>Afrokaviar</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
            Vote on upcoming features, follow what's coming soon, and see what's already available.
          </p>
        </div>

        {/* Admin create form */}
        {isAdmin && showCreate && (
          <div className="mb-12 p-6 rounded-2xl border border-primary/30 bg-primary/5">
            <h2 className="font-bold text-white mb-4 text-lg">New Feature Card</h2>
            <div className="space-y-3">
              <input
                className="w-full bg-zinc-900 border border-zinc-700 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/50"
                placeholder="Feature name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                data-testid="input-new-feature-name"
              />
              <textarea
                className="w-full bg-zinc-900 border border-zinc-700 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                placeholder="Feature description"
                rows={3}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                data-testid="input-new-feature-desc"
              />
              <div className="flex items-center gap-3">
                <button
                  className="px-5 py-2 rounded-full bg-primary text-black text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                  disabled={!newName.trim() || !newDesc.trim() || createMutation.isPending}
                  onClick={() => createMutation.mutate({ name: newName, description: newDesc })}
                  data-testid="button-create-feature-submit"
                >
                  {createMutation.isPending ? "Creating..." : "Create Feature"}
                </button>
                <button
                  className="px-5 py-2 rounded-full bg-zinc-800 text-zinc-400 text-sm font-bold hover:bg-zinc-700 transition-all"
                  onClick={() => { setShowCreate(false); setNewName(""); setNewDesc(""); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Available Now */}
        {deployed.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">Available Now</h2>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs font-bold px-2.5">
                {deployed.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {deployed.map((feature) => (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  userVote={votesData[feature.id] || null}
                  isAuthenticated={isAuthenticated}
                  isAdmin={isAdmin}
                  onVote={handleVote}
                  onRemoveVote={handleRemoveVote}
                  onStatusChange={isAdmin ? handleStatusChange : undefined}
                  onDelete={isAdmin ? handleDelete : undefined}
                />
              ))}
            </div>
          </section>
        )}

        {/* Coming Soon */}
        {confirmed.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Rocket className="w-4 h-4 text-amber-400" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">Coming Soon</h2>
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs font-bold px-2.5">
                {confirmed.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {confirmed.map((feature) => (
                <div key={feature.id} className="relative">
                  <div className="absolute -top-2 -right-2 z-10">
                    <span className="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-black rounded-full uppercase tracking-widest">Soon</span>
                  </div>
                  <FeatureCard
                    feature={feature}
                    userVote={votesData[feature.id] || null}
                    isAuthenticated={isAuthenticated}
                    isAdmin={isAdmin}
                    onVote={handleVote}
                    onRemoveVote={handleRemoveVote}
                    onStatusChange={isAdmin ? handleStatusChange : undefined}
                    onDelete={isAdmin ? handleDelete : undefined}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Vote on Features */}
        {requested.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <ThumbsUp className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">Vote on Features</h2>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-bold px-2.5">
                {requested.length}
              </Badge>
            </div>
            {!isAuthenticated && (
              <div className="mb-4 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-zinc-400">
                <Link href="/auth">
                  <span className="text-primary font-bold hover:underline cursor-pointer">Sign in</span>
                </Link>
                {" "}to vote on features you want to see.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {requested.map((feature) => (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  userVote={votesData[feature.id] || null}
                  isAuthenticated={isAuthenticated}
                  isAdmin={isAdmin}
                  onVote={handleVote}
                  onRemoveVote={handleRemoveVote}
                  onStatusChange={isAdmin ? handleStatusChange : undefined}
                  onDelete={isAdmin ? handleDelete : undefined}
                />
              ))}
            </div>
          </section>
        )}

        {featuresData.length === 0 && (
          <div className="text-center py-24 text-zinc-500">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
            <p className="text-lg font-bold text-zinc-400">No features yet</p>
            <p className="text-sm mt-1">Check back soon for the Afrokaviar roadmap.</p>
          </div>
        )}
      </div>
    </div>
  );
}
