import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, MailCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { sendMagicLink } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const { error: err } = await sendMagicLink(email, fullName);
      if (err) throw err;
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send link. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center w-full max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-8 animate-in zoom-in duration-500">
          <MailCheck className="w-8 h-8 text-emerald-400" />
        </div>
        <div className="w-full glass rounded-2xl p-8 text-center animate-in slide-in-from-bottom-4 duration-500 fade-in">
          <h1 className="text-2xl font-bold mb-3">Check your email</h1>
          <p className="text-muted-foreground mb-2">
            Magic link sent to <span className="text-white font-medium">{email}</span>.
          </p>
          <p className="text-muted-foreground text-sm mb-8">
            Click the link to activate your account and enter your command center.
          </p>
          <Button
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => setSent(false)}
          >
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

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
            <Label htmlFor="fullName">Your Name</Label>
            <Input
              id="fullName"
              required
              autoFocus
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

          <Button
            type="submit"
            className="w-full mt-6 bg-primary hover:bg-primary/90 text-white font-semibold glow-purple transition-all active:scale-[0.98]"
            disabled={isLoading}
            data-testid="button-signup-submit"
          >
            {isLoading ? "Sending..." : "Send Magic Link"}
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
