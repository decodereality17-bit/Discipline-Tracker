import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";

export default function Profile() {
  const { user, signOut } = useAuth();

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-white">Operative Profile</h1>
        <p className="text-muted-foreground uppercase tracking-widest text-xs mt-2 font-semibold">
          Identity & Settings
        </p>
      </header>

      <div className="glass rounded-3xl p-8 max-w-2xl">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center glow-purple">
            <User className="w-12 h-12 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user?.user_metadata?.full_name || "Operative"}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
            <div className="inline-block mt-2 px-3 py-1 bg-white/5 rounded-full text-xs font-semibold tracking-widest uppercase text-muted-foreground">
              ID: {user?.id.substring(0, 8)}...
            </div>
          </div>
        </div>

        <hr className="border-white/10 my-8" />

        <div className="space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">System Operations</h3>
          
          <Button 
            variant="destructive" 
            className="w-full sm:w-auto bg-red-950/50 text-red-500 border border-red-900/50 hover:bg-red-900/50"
            onClick={() => signOut()}
            data-testid="button-signout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Terminate Session
          </Button>
        </div>
      </div>
    </div>
  );
}
