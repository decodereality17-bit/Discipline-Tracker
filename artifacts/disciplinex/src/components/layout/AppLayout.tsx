import { Link, useLocation } from "wouter";
import { LayoutDashboard, CheckSquare, BarChart3, Zap, User, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 md:pb-0 md:pl-20">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-20 bg-card border-r border-border items-center py-8 z-50">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mb-8 glow-purple">
          <Zap className="w-6 h-6 text-primary" />
        </div>
        
        <nav className="flex flex-col gap-6 flex-1">
          <NavItem href="/dashboard" icon={<LayoutDashboard className="w-6 h-6" />} label="Dashboard" active={location === "/dashboard"} />
          <NavItem href="/tasks" icon={<CheckSquare className="w-6 h-6" />} label="Tasks" active={location === "/tasks"} />
          <NavItem href="/goals" icon={<Target className="w-6 h-6" />} label="Goals" active={location === "/goals"} />
          <NavItem href="/analytics" icon={<BarChart3 className="w-6 h-6" />} label="Analytics" active={location === "/analytics"} />
          <NavItem href="/insights" icon={<Zap className="w-6 h-6" />} label="Insights" active={location === "/insights"} />
        </nav>

        <div className="mt-auto">
          <NavItem href="/profile" icon={<User className="w-6 h-6" />} label="Profile" active={location === "/profile"} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 glass border-t border-white/5 flex items-center justify-around px-1 z-50">
        <NavItem href="/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Home" active={location === "/dashboard"} mobile />
        <NavItem href="/tasks" icon={<CheckSquare className="w-5 h-5" />} label="Tasks" active={location === "/tasks"} mobile />
        <NavItem href="/goals" icon={<Target className="w-5 h-5" />} label="Goals" active={location === "/goals"} mobile />
        <NavItem href="/analytics" icon={<BarChart3 className="w-5 h-5" />} label="Stats" active={location === "/analytics"} mobile />
        <NavItem href="/insights" icon={<Zap className="w-5 h-5" />} label="Insights" active={location === "/insights"} mobile />
        <NavItem href="/profile" icon={<User className="w-5 h-5" />} label="Profile" active={location === "/profile"} mobile />
      </nav>
    </div>
  );
}

function NavItem({ href, icon, label, active, mobile = false }: { href: string, icon: React.ReactNode, label: string, active: boolean, mobile?: boolean }) {
  return (
    <Link href={href}>
      <div 
        className={cn(
          "flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors duration-200",
          mobile ? "w-12 h-14 rounded-xl" : "w-14 h-14 rounded-xl",
          active ? "text-primary bg-primary/10 glow-purple" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
        )}
        data-testid={`nav-${label.toLowerCase()}`}
      >
        {icon}
        {mobile && <span className="text-[10px] font-medium">{label}</span>}
      </div>
    </Link>
  );
}
