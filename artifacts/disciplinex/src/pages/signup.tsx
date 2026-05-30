import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap } from "lucide-react";
import { upsertProfile } from "@workspace/api-client-react";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error: signUpError } = await signUp(email, password, fullName);
      if (signUpError) throw signUpError;

      // Create profile record
      const userId = data?.user?.id;
      if (userId) {
        try {
          await upsertProfile(userId, { full_name: fullName, email });
        } catch {
          // Non-fatal: profile creation can be retried
        }
      }

      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center w-full max-w-md mx-auto px-4">
      <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-8 glow-purple animate-in zoom-in duration-500">
        <Zap className="w-8 h-8 text-primary" />
      </div>

      <div className="w-full glass rounded-2xl p-8 animate-in slide-in-from-bottom-4 duration-500 fade-in">
        <h1 className="text-3xl font-bold text-center mb-2 glow-text tracking-tight">Initiate Sequence</h1>
        <p className="text-muted-foreground text-center mb-8">Begin your discipline protocol.</p>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/20 border border-destructive/50 text-destructive-foreground mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Designation (Name)</Label>
            <Input
              id="fullName"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="bg-black/50 border-white/10 focus-visible:ring-primary"
              data-testid="input-signup-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-black/50 border-white/10 focus-visible:ring-primary"
              data-testid="input-signup-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Access Code (Password)</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-black/50 border-white/10 focus-visible:ring-primary"
              data-testid="input-signup-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-6 bg-primary hover:bg-primary/90 text-white font-semibold glow-purple transition-all active:scale-[0.98]"
            disabled={isLoading}
            data-testid="button-signup-submit"
          >
            {isLoading ? "Initializing..." : "Initialize"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Already active?{" "}
          <Link href="/login">
            <span className="text-primary hover:text-primary/80 font-medium cursor-pointer">Login here</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
