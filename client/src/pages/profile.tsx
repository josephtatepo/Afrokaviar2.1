import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, Check, Clock, Copy, LogOut, Mail, Save, User, UserPlus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

const ADMIN_ROOT_EMAIL = "josephtatepo@gmail.com";

type Invite = {
  id: string;
  email: string;
  inviteCode: string;
  role: string;
  acceptedBy: string | null;
  acceptedAt: string | null;
  expiresAt: string;
  createdAt: string;
};

export default function Profile() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [handle, setHandle] = useState("");
  const [handleError, setHandleError] = useState("");

  const isAdmin = user?.email === ADMIN_ROOT_EMAIL;

  const { data: profileData } = useQuery({
    queryKey: ["/api/user/profile"],
    enabled: !!user,
  });

  const updateHandleMutation = useMutation({
    mutationFn: async (newHandle: string) => {
      const res = await fetch("/api/user/handle", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: newHandle }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update handle");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Handle updated", description: "Your @handle has been saved." });
      setHandle("");
    },
    onError: (err: Error) => {
      setHandleError(err.message);
    },
  });

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      queryClient.clear();
      setLocation("/");
    } catch (err) {
      toast({ title: "Error", description: "Failed to logout", variant: "destructive" });
    }
  };

  const { data: invites = [] } = useQuery<Invite[]>({
    queryKey: ["/api/me/invites"],
    enabled: !!user,
  });

  const [inviteEmail, setInviteEmail] = useState("");

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: "user" }),
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
      queryClient.invalidateQueries({ queryKey: ["/api/me/invites"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Admins can have 3+ char handles, regular users need 7+
  const minHandleLength = isAdmin ? 3 : 7;

  const handleSaveHandle = () => {
    setHandleError("");
    if (handle.length < minHandleLength) {
      setHandleError(`Handle must be at least ${minHandleLength} characters`);
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
      setHandleError("Handle can only contain letters, numbers, and underscores");
      return;
    }
    updateHandleMutation.mutate(handle);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  if (!user) {
    setLocation("/auth");
    return null;
  }

  const currentHandle = (profileData as any)?.handle || (user as any)?.handle;
  const changesThisMonth = parseInt((profileData as any)?.handleChangesThisMonth || "0");
  const canChangeHandle = changesThisMonth < 2;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 -z-10 opacity-[0.14] [background-image:radial-gradient(900px_500px_at_25%_10%,rgba(34,211,238,.22),transparent),radial-gradient(900px_500px_at_80%_15%,rgba(245,158,11,.16),transparent)]" />

      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/explore" data-testid="link-profile-back">
              <span className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
                Back to Explore
              </span>
            </Link>
            <Badge className="border border-white/10 bg-white/5 text-white/70" data-testid="badge-profile">
              Profile
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Profile Section */}
        <Card className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80 backdrop-blur-md mb-6" data-testid="panel-profile">
          <div className="flex items-center gap-4 mb-6">
            {user.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-16 h-16 rounded-full border-2 border-white/10"
                data-testid="img-profile-avatar"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <User className="w-8 h-8 text-white/40" />
              </div>
            )}
            <div>
              <div className="font-display text-xl text-white" data-testid="text-profile-name">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-sm text-white/60" data-testid="text-profile-email">
                {user.email}
              </div>
              {currentHandle && (
                <div className="text-sm text-[#22D3EE]" data-testid="text-profile-handle">
                  @{currentHandle}
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-white/10 mb-6" />

          <div className="space-y-4">
            <div>
              <Label className="text-sm text-white/70 mb-2 block">Your Handle</Label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">@</span>
                  <Input
                    value={handle}
                    onChange={(e) => {
                      setHandle(e.target.value);
                      setHandleError("");
                    }}
                    placeholder={currentHandle || "yourhandle"}
                    className="pl-8 h-11 bg-black/30 border-white/10 text-white placeholder:text-white/35"
                    disabled={!canChangeHandle}
                    data-testid="input-handle"
                  />
                </div>
                <Button
                  onClick={handleSaveHandle}
                  disabled={!handle || !canChangeHandle || updateHandleMutation.isPending}
                  className="bg-[#22D3EE] text-black hover:bg-[#06B6D4]"
                  data-testid="button-save-handle"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
              {handleError && (
                <p className="text-red-400 text-xs mt-2" data-testid="text-handle-error">{handleError}</p>
              )}
              <p className="text-xs text-white/45 mt-2">
                Minimum {minHandleLength} characters. You can change your handle {2 - changesThisMonth} more time(s) this month.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs text-white/45 uppercase tracking-wider">Member Since</div>
                <div className="mt-1 text-white font-medium">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs text-white/45 uppercase tracking-wider">Auth Provider</div>
                <div className="mt-1 text-white font-medium capitalize">
                  {user.authProvider || "N/A"}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Analytics Snapshot - Visible to all */}
        <Card className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80 backdrop-blur-md mb-6" data-testid="panel-analytics">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display text-xl text-white">Analytics Snapshot</div>
            <BarChart3 className="h-5 w-5 text-white/60" />
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: "Uploads", value: "0", hint: "your submissions" },
              { label: "Purchases", value: "0", hint: "songs bought" },
              { label: "Favorites", value: "0", hint: "saved tracks" },
              { label: "Library", value: "0", hint: "items stored" },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-2xl border border-white/10 bg-black/30 p-4"
                data-testid={`card-stat-${m.label.toLowerCase()}`}
              >
                <div className="text-xs tracking-[0.18em] text-white/45">{m.label}</div>
                <div className="mt-2 font-display text-3xl text-white">{m.value}</div>
                <div className="mt-1 text-xs text-white/55">{m.hint}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Invites Section - Visible to all users */}
        <Card className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80 backdrop-blur-md mb-6" data-testid="panel-invites">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-white/60" />
              <div className="font-display text-xl text-white">Invite Friends</div>
            </div>
            <Badge className="border border-white/10 bg-white/5 text-white/70">
              {invites.length} sent
            </Badge>
          </div>

          <div className="flex gap-3 mb-4">
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="friend@example.com"
              className="h-11 bg-black/30 border-white/10 text-white placeholder:text-white/35"
              data-testid="input-invite-email"
            />
            <Button
              onClick={() => inviteMutation.mutate(inviteEmail)}
              disabled={!inviteEmail || inviteMutation.isPending}
              className="bg-accent text-accent-foreground"
              data-testid="button-send-invite"
            >
              <Mail className="h-4 w-4 mr-2" />
              Invite
            </Button>
          </div>

          {invites.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-white/45 uppercase tracking-wider">Your Invites</Label>
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3"
                  data-testid={`row-invite-${invite.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{invite.email}</div>
                    <div className="text-xs text-white/45">
                      {invite.acceptedAt ? (
                        <span className="text-green-400 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Accepted
                        </span>
                      ) : new Date(invite.expiresAt) < new Date() ? (
                        <span className="text-red-400 flex items-center gap-1">
                          <X className="h-3 w-3" /> Expired
                        </span>
                      ) : (
                        <span className="text-yellow-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </div>
                  </div>
                  {!invite.acceptedAt && new Date(invite.expiresAt) > new Date() && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white/50 hover:text-white"
                      onClick={() => {
                        const inviteLink = `${window.location.origin}/auth?invite=${invite.inviteCode}`;
                        navigator.clipboard.writeText(inviteLink);
                        toast({ title: "Copied!", description: "Invite link copied to clipboard" });
                      }}
                      data-testid={`button-copy-invite-${invite.id}`}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Admin Controls - Only visible to admins */}
        {isAdmin && (
          <Card className="rounded-2xl border border-[#22D3EE]/30 bg-[#22D3EE]/5 p-6 text-white/80 backdrop-blur-md" data-testid="panel-admin-controls">
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30">
                Admin Only
              </Badge>
              <div className="font-display text-xl text-white">Admin Controls</div>
            </div>
            <p className="text-sm text-white/60 mb-4">
              Access the full Admin Studio for content management, review queues, and platform controls.
            </p>
            <Link href="/admin" data-testid="link-admin-studio">
              <Button className="bg-[#22D3EE] text-black hover:bg-[#06B6D4]">
                Open Admin Studio
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
