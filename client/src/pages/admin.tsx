import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, Check, Copy, Eye, Mail, Music, ShieldAlert, UserPlus, X } from "lucide-react";

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
  const [inviteRole, setInviteRole] = useState("user");
  
  // Promotion dialog state
  const [promoteTrack, setPromoteTrack] = useState<SocialTrack | null>(null);
  const [promoteTitle, setPromoteTitle] = useState("");
  const [promoteArtist, setPromoteArtist] = useState("");
  const [promoteAlbum, setPromoteAlbum] = useState("");
  const [promoteGenre, setPromoteGenre] = useState("");

  const userEmail = user?.email ?? "";
  const isAdmin = userEmail === ADMIN_ROOT_EMAIL;

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

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create invite");
      }
      return res.json();
    },
    onSuccess: (data) => {
      const inviteLink = `${window.location.origin}/auth?invite=${data.inviteCode}`;
      navigator.clipboard.writeText(inviteLink);
      toast({ 
        title: "Invite created!", 
        description: `Link copied to clipboard. Share it with ${inviteEmail}` 
      });
      setInviteEmail("");
      setInviteRole("user");
      queryClient.invalidateQueries({ queryKey: ["/api/me/invites"] });
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
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4" data-testid="card-control-invite">
                <div className="flex items-center gap-2 text-xs tracking-[0.18em] text-white/45 mb-3">
                  <UserPlus className="h-4 w-4" />
                  Invite User
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
                      data-testid="input-invite-email"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-white/60">Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger className="mt-1 h-10 bg-black/30 border-white/10 text-white" data-testid="select-invite-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full bg-accent text-accent-foreground"
                    disabled={!inviteEmail || inviteMutation.isPending}
                    onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
                    data-testid="button-send-invite"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Create Invite Link
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4" data-testid="card-control-perms">
                <div className="text-xs tracking-[0.18em] text-white/45" data-testid="text-control-perms-label">
                  Root admin
                </div>
                <div className="mt-2 text-sm text-white/70" data-testid="text-control-perms-desc">
                  Only {ADMIN_ROOT_EMAIL} can invite admins, change roles, or ban users.
                </div>
              </div>

              <Button
                className="bg-primary text-primary-foreground"
                data-testid="button-feature-home"
                onClick={() => toast({ title: "Coming soon", description: "Feature homepage content selection coming soon." })}
              >
                Feature on homepage
              </Button>
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
