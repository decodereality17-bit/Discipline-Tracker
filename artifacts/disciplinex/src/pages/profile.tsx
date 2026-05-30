import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, LogOut, Save, Zap, Edit2 } from "lucide-react";
import {
  useGetProfile,
  getGetProfileQueryKey,
  useUpsertProfile,
  useGetUserStats,
  getGetUserStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { calculateLevel } from "@/lib/discipline";

export default function Profile() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");

  const { data: profile, isLoading: profileLoading } = useGetProfile(user?.id || "", {
    query: {
      enabled: !!user?.id,
      queryKey: getGetProfileQueryKey(user?.id || ""),
    },
  });

  const { data: stats } = useGetUserStats(user?.id || "", {
    query: {
      enabled: !!user?.id,
      queryKey: getGetUserStatsQueryKey(user?.id || ""),
    },
  });

  const upsertProfile = useUpsertProfile();

  const handleEditStart = () => {
    setFullName(profile?.full_name || user?.user_metadata?.full_name || "");
    setEditing(true);
  };

  const handleSave = () => {
    if (!user) return;
    upsertProfile.mutate(
      { userId: user.id, data: { full_name: fullName, email: user.email } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey(user.id) });
          setEditing(false);
        },
      }
    );
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || "Operative";
  const level = calculateLevel(stats?.discipline_score ?? 0);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-white">Operative Profile</h1>
        <p className="text-muted-foreground uppercase tracking-widest text-xs mt-2 font-semibold">
          Identity & Settings
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Identity Card */}
        <div className="md:col-span-2 glass rounded-3xl p-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center glow-purple shrink-0">
              <User className="w-12 h-12 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-xs uppercase tracking-widest text-muted-foreground">Designation</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-name"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="bg-black/50 border-white/10"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={upsertProfile.isPending}
                      className="bg-primary hover:bg-primary/80 glow-purple shrink-0"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(false)}
                      className="shrink-0"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold truncate">{profileLoading ? "..." : displayName}</h2>
                    <button onClick={handleEditStart} className="text-muted-foreground hover:text-white transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-muted-foreground truncate">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="inline-block px-3 py-1 bg-primary/10 rounded-full text-xs font-semibold tracking-widest uppercase text-primary">
                      {level}
                    </div>
                    <div className="inline-block px-3 py-1 bg-white/5 rounded-full text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                      ID: {user?.id.substring(0, 8)}...
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <hr className="border-white/10 my-6" />

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Account Info</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Email</div>
                <div className="text-white">{user?.email}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Member Since</div>
                <div className="text-white">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Current Rank</div>
                <div className="text-primary font-semibold">{level}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Discipline Score</div>
                <div className="text-white font-bold">{Math.round(stats?.discipline_score ?? 0)}</div>
              </div>
            </div>
          </div>

          <hr className="border-white/10 my-6" />

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">System Operations</h3>
            <Button
              variant="destructive"
              className="bg-red-950/50 text-red-500 border border-red-900/50 hover:bg-red-900/50"
              onClick={() => signOut()}
              data-testid="button-signout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Terminate Session
            </Button>
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          <div className="glass rounded-2xl p-6 text-center">
            <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="text-4xl font-black glow-text">{Math.round(stats?.discipline_score ?? 0)}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Discipline Score</div>
          </div>
          <div className="glass rounded-2xl p-6 text-center">
            <div className="text-3xl font-black text-orange-500">{stats?.current_streak ?? 0}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Current Streak</div>
          </div>
          <div className="glass rounded-2xl p-6 text-center">
            <div className="text-3xl font-black text-emerald-500">{stats?.total_tasks_completed ?? 0}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Total Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
