import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap } from "lucide-react";

function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid credentials")) {
    return "Incorrect email or password. If you just signed up, please confirm your email first.";
  }
  if (m.includes("email not confirmed")) {
    return "Please check your inbox and click the confirmation link before logging in.";
  }
  if (m.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return msg;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) throw signInError;
      setLocation("/dashboard");
    } catch (err: any) {
      setError(friendlyError(err.message || "Failed to sign in"));
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
        <h1 className="text-3xl font-bold text-center mb-2 glow-text tracking-tight">DisciplineX</h1>
        <p className="text-muted-foreground text-center mb-8">Access your command center.</p>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/20 border border-destructive/50 text-destructive-foreground mb-6 text-sm leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-black/50 border-white/10 focus-visible:ring-primary"
              data-testid="input-login-email"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-black/50 border-white/10 focus-visible:ring-primary"
              data-testid="input-login-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-6 bg-primary hover:bg-primary/90 text-white font-semibold glow-purple transition-all active:scale-[0.98]"
            disabled={isLoading}
            data-testid="button-login-submit"
          >
            {isLoading ? "Authenticating..." : "Enter Command Center"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Don't have access?{" "}
          <Link href="/signup">
            <span className="text-primary hover:text-primary/80 font-medium cursor-pointer">Initiate Setup</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
