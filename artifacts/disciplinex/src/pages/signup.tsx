import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, MailCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // Optional: auto login session check
      if (data?.user) {
        setSuccess(true);

        // direct redirect to dashboard
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || "Signup failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // SUCCESS UI
  if (success) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center w-full max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-8">
          <MailCheck className="w-8 h-8 text-emerald-400" />
        </div>

        <div className="w-full glass rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Account Created</h1>
          <p className="text-muted-foreground">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center w-full max-w-md mx-auto px-4">
      <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-8">
        <Zap className="w-8 h-8 text-primary" />
      </div>

      <div className="w-full glass rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          Create Account
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          Start your discipline journey
        </p>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/20 text-red-400 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label>Your Name</Label>
            <Input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-black/50 border-white/10"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black/50 border-white/10"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black/50 border-white/10"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full mt-6"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login">
            <span className="text-primary cursor-pointer">
              Login
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
            }
