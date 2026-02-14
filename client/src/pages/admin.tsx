import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, Check, Copy, Eye, Mail, Music, ShieldAlert, UserPlus, X, Upload, Star, Image, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";

const ADMIN_ROOT_EMAIL = "josephtatepo@gmail.com";

type SocialTrack = {
  id: string;
  title: string;
  audioUrl: string;
  artworkUrl: string | null;
  status: string;
  uploadedBy: string;
  createdAt: string;
};

export default function AdminStudio() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("admin");
  
  // Promotion dialog state
  const [promoteTrack, setPromoteTrack] = useState<SocialTrack | null>(null);
  const [promoteTitle, setPromoteTitle] = useState("");
  const [promoteArtist, setPromoteArtist] = useState("");
  const [promoteAlbum, setPromoteAlbum] = useState("");
  const [promoteGenre, setPromoteGenre] = useState("");

  // Featured song state
  const [featTitle, setFeatTitle] = useState("");
  const [featArtist, setFeatArtist] = useState("");
  const [featAlbum, setFeatAlbum] = useState("");
  const [featGenre, setFeatGenre] = useState("");
  const [featPrice, setFeatPrice] = useState("1.00");
  const [featAudioPath, setFeatAudioPath] = useState("");
  const [featAudioName, setFeatAudioName] = useState("");
  const [featArtworkPath, setFeatArtworkPath] = useState("");
  const [featArtworkName, setFeatArtworkName] = useState("");
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isUploadingArtwork, setIsUploadingArtwork] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const artworkInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useUpload();

  const userEmail = user?.email ?? "";
  const isAdmin = !!user?.adminRole;
  const isRootAdmin = user?.adminRole === "root_admin";

  const { data: analytics } = useQuery<{ uploads: number; purchases: number; promoted: number; libraryItems: number; registeredUsers: number }>({
    queryKey: ["/api/admin/analytics"],
    enabled: isAdmin,
  });

  const { data: reviewQueue = [] } = useQuery<SocialTrack[]>({
    queryKey: ["/api/admin/review-queue"],
    enabled: isAdmin,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/social-tracks/${id}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to review track");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      toast({ title: "Track reviewed", description: "The submission has been processed." });
    },
  });

  const promoteMutation = useMutation({
    mutationFn: async ({ id, title, artist, album, genre }: { id: string; title: string; artist: string; album: string; genre: string }) => {
      const res = await fetch(`/api/admin/social-tracks/${id}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, artist, album, genre }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to promote track");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
      setPromoteTrack(null);
      setPromoteTitle("");
      setPromoteArtist("");
      setPromoteAlbum("");
      setPromoteGenre("");
      toast({ title: "Track promoted!", description: "The track is now live in the Music catalogue for $1." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const openPromoteDialog = (track: SocialTrack) => {
    setPromoteTrack(track);
    setPromoteTitle(track.title);
    setPromoteArtist("");
    setPromoteAlbum("");
    setPromoteGenre("");
  };

  const handlePromote = () => {
    if (!promoteTrack) return;
    promoteMutation.mutate({
      id: promoteTrack.id,
      title: promoteTitle,
      artist: promoteArtist,
      album: promoteAlbum,
      genre: promoteGenre,
    });
  };

  const { data: currentFeatured } = useQuery<{ song?: { id: string; title: string; artist: string; artworkUrl: string | null; audioUrl: string; genre: string | null } }>({
    queryKey: ["/api/featured/homepage_hero"],
    enabled: isAdmin,
  });

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAudio(true);
    try {
      const result = await uploadFile(file);
      if (result) {
        setFeatAudioPath(result.objectPath);
        setFeatAudioName(file.name);
        if (!featTitle) {
          setFeatTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
        }
        toast({ title: "Audio uploaded", description: file.name });
      }
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploadingAudio(false);
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
  };

  const handleArtworkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingArtwork(true);
    try {
      const result = await uploadFile(file);
      if (result) {
        setFeatArtworkPath(result.objectPath);
        setFeatArtworkName(file.name);
        toast({ title: "Artwork uploaded", description: file.name });
      }
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploadingArtwork(false);
      if (artworkInputRef.current) artworkInputRef.current.value = "";
    }
  };

  const publishFeaturedMutation = useMutation({
    mutationFn: async () => {
      const songRes = await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: featTitle,
          artist: featArtist,
          album: featAlbum || null,
          genre: featGenre || null,
          audioUrl: featAudioPath,
          artworkUrl: featArtworkPath || null,
          price: Math.round(parseFloat(featPrice) * 100),
        }),
      });
      if (!songRes.ok) {
        const err = await songRes.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create song");
      }
      const song = await songRes.json();

      const featRes = await fetch("/api/admin/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: "song",
          contentId: song.id,
          songId: song.id,
          position: "homepage_hero",
        }),
      });
      if (!featRes.ok) throw new Error("Failed to set featured song");
      return featRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/featured/homepage_hero"] });
      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
      setFeatTitle("");
      setFeatArtist("");
      setFeatAlbum("");
      setFeatGenre("");
      setFeatPrice("1.00");
      setFeatAudioPath("");
      setFeatAudioName("");
      setFeatArtworkPath("");
      setFeatArtworkName("");
      toast({ title: "Featured song published!", description: "It's now live on the homepage." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const addAdminMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const res = await fetch("/api/admin/add-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to add admin");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Admin added!", 
        description: data.message 
      });
      setInviteEmail("");
      setInviteRole("admin");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    setLocation("/explore");
    return null;
  }

  const metrics = [
    { label: "Users", value: analytics?.registeredUsers ?? 0, hint: "registered" },
    { label: "Uploads", value: analytics?.uploads ?? 0, hint: "submitted by users" },
    { label: "Purchases", value: analytics?.purchases ?? 0, hint: "songs bought" },
    { label: "Promoted", value: analytics?.promoted ?? 0, hint: "social → music" },
    { label: "Library", value: analytics?.libraryItems ?? 0, hint: "items stored" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 -z-10 opacity-[0.14] [background-image:radial-gradient(900px_500px_at_25%_10%,rgba(34,211,238,.22),transparent),radial-gradient(900px_500px_at_80%_15%,rgba(245,158,11,.16),transparent)]" />

      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/explore" data-testid="link-admin-back">
              <span className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
                Back to Explore
              </span>
            </Link>
            <Badge className="border border-white/10 bg-white/5 text-white/70" data-testid="badge-admin">
              Admin Studio
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60">{userEmail}</span>
            <Badge
              className="border border-[#22D3EE]/30 bg-[#22D3EE]/10 text-[#22D3EE] shadow-[0_0_18px_rgba(34,211,238,0.18)]"
              data-testid="badge-admin-access"
            >
              root admin
            </Badge>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mt-6 grid gap-4 lg:grid-cols-3"
        >
          <Card className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/80 backdrop-blur-md lg:col-span-2" data-testid="panel-admin-metrics">
            <div className="flex items-center justify-between">
              <div className="font-display text-xl text-white" data-testid="text-admin-metrics-title">
                Analytics snapshot
              </div>
              <BarChart3 className="h-5 w-5 text-white/60" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-5">
              {metrics.map((m) => (
                <div
                  key={m.label}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  data-testid={`card-metric-${m.label.toLowerCase()}`}
                >
                  <div className="text-xs tracking-[0.18em] text-white/45" data-testid={`text-metric-label-${m.label.toLowerCase()}`}>
                    {m.label}
                  </div>
                  <div className="mt-2 font-display text-3xl text-white" data-testid={`text-metric-value-${m.label.toLowerCase()}`}>
                    {m.value}
                  </div>
                  <div className="mt-1 text-xs text-white/55" data-testid={`text-metric-hint-${m.label.toLowerCase()}`}>
                    {m.hint}
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-5 bg-white/10" />

            <div className="flex items-center justify-between">
              <div>
                <div className="font-display text-xl text-white" data-testid="text-admin-queue-title">
                  Review queue
                </div>
                <div className="mt-1 text-sm text-white/60" data-testid="text-admin-queue-desc">
                  Approve, reject, and feature submissions.
                </div>
              </div>
              <Badge className="border border-white/10 bg-white/5 text-white/70" data-testid="badge-queue-count">
                {reviewQueue.length} items
              </Badge>
            </div>

            <div className="mt-4 grid gap-2" data-testid="list-queue">
              {reviewQueue.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center text-white/50">
                  No pending submissions to review
                </div>
              ) : (
                reviewQueue.map((q) => (
                  <div
                    key={q.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 p-4"
                    data-testid={`row-queue-${q.id}`}
                  >
                    <div>
                      <div className="text-xs tracking-[0.18em] text-white/45" data-testid={`text-queue-type-${q.id}`}>
                        social_track
                      </div>
                      <div className="mt-1 text-sm text-white" data-testid={`text-queue-title-${q.id}`}>
                        {q.title}
                      </div>
                      <div className="mt-1 text-xs text-white/55" data-testid={`text-queue-meta-${q.id}`}>
                        submitted {new Date(q.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/10 text-white hover:bg-white/15 border border-white/10"
                        data-testid={`button-queue-view-${q.id}`}
                        onClick={() => window.open(q.audioUrl, "_blank")}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="bg-[#22D3EE] text-black hover:bg-[#22D3EE]/90"
                        disabled={promoteMutation.isPending}
                        data-testid={`button-queue-promote-${q.id}`}
                        onClick={() => openPromoteDialog(q)}
                      >
                        <Music className="mr-2 h-4 w-4" />
                        Promote to Music
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/10 text-white hover:bg-white/15 border border-white/10"
                        disabled={reviewMutation.isPending}
                        data-testid={`button-queue-reject-${q.id}`}
                        onClick={() => reviewMutation.mutate({ id: q.id, status: "rejected" })}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/80 backdrop-blur-md" data-testid="panel-admin-controls">
            <div className="flex items-center justify-between">
              <div className="font-display text-xl text-white" data-testid="text-admin-controls-title">
                Controls
              </div>
              <ShieldAlert className="h-5 w-5 text-white/60" />
            </div>

            <div className="mt-4 grid gap-4">
              {isRootAdmin && <div className="rounded-2xl border border-white/10 bg-black/30 p-4" data-testid="card-control-add-admin">
                <div className="flex items-center gap-2 text-xs tracking-[0.18em] text-white/45 mb-3">
                  <UserPlus className="h-4 w-4" />
                  Add Admin
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-white/60">Email</Label>
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="mt-1 h-10 bg-black/30 border-white/10 text-white placeholder:text-white/35"
                      data-testid="input-add-admin-email"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-white/60">Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger className="mt-1 h-10 bg-black/30 border-white/10 text-white" data-testid="select-add-admin-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="root_admin">Root Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full bg-accent text-accent-foreground"
                    disabled={!inviteEmail || addAdminMutation.isPending}
                    onClick={() => addAdminMutation.mutate({ email: inviteEmail, role: inviteRole })}
                    data-testid="button-add-admin"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    {addAdminMutation.isPending ? "Adding..." : "Add Admin"}
                  </Button>
                </div>
              </div>}

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4" data-testid="card-control-perms">
                <div className="text-xs tracking-[0.18em] text-white/45" data-testid="text-control-perms-label">
                  Root admin
                </div>
                <div className="mt-2 text-sm text-white/70" data-testid="text-control-perms-desc">
                  Only {ADMIN_ROOT_EMAIL} can invite admins, change roles, or ban users.
                </div>
              </div>

            </div>
          </Card>

          <Card className="rounded-2xl border border-[#F4BE44]/20 bg-white/5 p-5 text-white/80 backdrop-blur-md lg:col-span-3" data-testid="panel-featured-song">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-[#F4BE44]" />
                <div className="font-display text-xl text-white" data-testid="text-featured-panel-title">
                  Featured Song
                </div>
              </div>
              {currentFeatured?.song && (
                <Badge className="border border-[#F4BE44]/30 bg-[#F4BE44]/10 text-[#F4BE44]" data-testid="badge-current-featured">
                  Live: {currentFeatured.song.title} — {currentFeatured.song.artist}
                </Badge>
              )}
            </div>
            <p className="text-sm text-white/50 mb-5">Upload a song and set it as the featured track on the homepage.</p>

            <div className="grid gap-5 lg:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-white/60">Audio File *</Label>
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/flac,.mp3,.m4a,.wav,.flac"
                    className="hidden"
                    onChange={handleAudioUpload}
                    data-testid="input-feat-audio-file"
                  />
                  <Button
                    variant="secondary"
                    className="w-full mt-1 bg-black/30 border border-white/10 text-white hover:bg-white/10 justify-start gap-2"
                    onClick={() => audioInputRef.current?.click()}
                    disabled={isUploadingAudio}
                    data-testid="button-feat-upload-audio"
                  >
                    {isUploadingAudio ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {featAudioName || "Choose audio file..."}
                  </Button>
                </div>
                <div>
                  <Label className="text-xs text-white/60">Cover Artwork</Label>
                  <input
                    ref={artworkInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={handleArtworkUpload}
                    data-testid="input-feat-artwork-file"
                  />
                  <div className="flex gap-2 mt-1">
                    <Button
                      variant="secondary"
                      className="flex-1 bg-black/30 border border-white/10 text-white hover:bg-white/10 justify-start gap-2"
                      onClick={() => artworkInputRef.current?.click()}
                      disabled={isUploadingArtwork}
                      data-testid="button-feat-upload-artwork"
                    >
                      {isUploadingArtwork ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
                      {featArtworkName || "Choose artwork..."}
                    </Button>
                    {featArtworkPath && (
                      <div className="w-10 h-10 rounded-lg border border-white/10 overflow-hidden shrink-0">
                        <img src={featArtworkPath} alt="artwork" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-white/60">Title *</Label>
                    <Input
                      value={featTitle}
                      onChange={(e) => setFeatTitle(e.target.value)}
                      placeholder="Song title"
                      className="mt-1 h-10 bg-black/30 border-white/10 text-white placeholder:text-white/35"
                      data-testid="input-feat-title"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-white/60">Artist *</Label>
                    <Input
                      value={featArtist}
                      onChange={(e) => setFeatArtist(e.target.value)}
                      placeholder="Artist name"
                      className="mt-1 h-10 bg-black/30 border-white/10 text-white placeholder:text-white/35"
                      data-testid="input-feat-artist"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-white/60">Album</Label>
                    <Input
                      value={featAlbum}
                      onChange={(e) => setFeatAlbum(e.target.value)}
                      placeholder="Optional"
                      className="mt-1 h-10 bg-black/30 border-white/10 text-white placeholder:text-white/35"
                      data-testid="input-feat-album"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-white/60">Genre</Label>
                    <Input
                      value={featGenre}
                      onChange={(e) => setFeatGenre(e.target.value)}
                      placeholder="e.g. Afrobeats"
                      className="mt-1 h-10 bg-black/30 border-white/10 text-white placeholder:text-white/35"
                      data-testid="input-feat-genre"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-white/60">Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={featPrice}
                      onChange={(e) => setFeatPrice(e.target.value)}
                      className="mt-1 h-10 bg-black/30 border-white/10 text-white placeholder:text-white/35"
                      data-testid="input-feat-price"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  className="bg-[#F4BE44] text-black hover:bg-[#F4BE44]/90 font-black uppercase text-xs tracking-widest px-6 h-10"
                  disabled={!featTitle || !featArtist || !featAudioPath || publishFeaturedMutation.isPending}
                  onClick={() => publishFeaturedMutation.mutate()}
                  data-testid="button-publish-featured"
                >
                  {publishFeaturedMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Star className="h-4 w-4 mr-2" />}
                  {publishFeaturedMutation.isPending ? "Publishing..." : "Publish Featured"}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Promote to Music Dialog */}
      <Dialog open={!!promoteTrack} onOpenChange={(open) => !open && setPromoteTrack(null)}>
        <DialogContent className="bg-zinc-900 border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Promote to Music Catalogue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-white/60">
              This track will be added to the Music catalogue and priced at <span className="text-[#22D3EE] font-semibold">$1</span> automatically.
            </p>
            <div className="space-y-2">
              <Label htmlFor="promote-title">Song Title</Label>
              <Input
                id="promote-title"
                value={promoteTitle}
                onChange={(e) => setPromoteTitle(e.target.value)}
                className="bg-black/30 border-white/10"
                data-testid="input-promote-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promote-artist">Artist Name *</Label>
              <Input
                id="promote-artist"
                value={promoteArtist}
                onChange={(e) => setPromoteArtist(e.target.value)}
                placeholder="Enter artist name"
                className="bg-black/30 border-white/10"
                data-testid="input-promote-artist"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promote-album">Album (optional)</Label>
              <Input
                id="promote-album"
                value={promoteAlbum}
                onChange={(e) => setPromoteAlbum(e.target.value)}
                placeholder="Enter album name"
                className="bg-black/30 border-white/10"
                data-testid="input-promote-album"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promote-genre">Genre (optional)</Label>
              <Input
                id="promote-genre"
                value={promoteGenre}
                onChange={(e) => setPromoteGenre(e.target.value)}
                placeholder="e.g. Afrobeats, Highlife, Amapiano"
                className="bg-black/30 border-white/10"
                data-testid="input-promote-genre"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setPromoteTrack(null)}
              className="bg-white/10 text-white hover:bg-white/15 border border-white/10"
              data-testid="button-promote-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePromote}
              disabled={!promoteArtist || promoteMutation.isPending}
              className="bg-[#22D3EE] text-black hover:bg-[#22D3EE]/90"
              data-testid="button-promote-confirm"
            >
              {promoteMutation.isPending ? "Promoting..." : "Promote for $1"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
