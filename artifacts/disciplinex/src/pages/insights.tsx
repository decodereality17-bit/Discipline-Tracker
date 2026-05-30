import { useAuth } from "@/hooks/useAuth";
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";
import { Shield, Zap, Target, Flame, Trophy, Lock } from "lucide-react";
import { useGetUserStats, getGetUserStatsQueryKey } from "@workspace/api-client-react";

export default function Insights() {
  const { user } = useAuth();
  
  const { data: stats } = useGetUserStats(user?.id || "", {
    query: { enabled: !!user?.id, queryKey: getGetUserStatsQueryKey(user?.id || "") }
  });
  
  const currentScore = stats?.discipline_score || 0;
  
  // Calculate next level threshold
  let nextThreshold = 100;
  let nextLevel = "Master";
  
  if (currentScore <= 20) { nextThreshold = 20; nextLevel = "Focused"; }
  else if (currentScore <= 40) { nextThreshold = 40; nextLevel = "Disciplined"; }
  else if (currentScore <= 60) { nextThreshold = 60; nextLevel = "Elite"; }
  else if (currentScore <= 80) { nextThreshold = 80; nextLevel = "Master"; }

  const progressToNext = currentScore >= 80 ? 100 : ((currentScore - (nextThreshold - 20)) / 20) * 100;
  
  const progressData = [
    { name: 'Background', value: 100, fill: 'rgba(255,255,255,0.05)' },
    { name: 'Progress', value: progressToNext, fill: 'hsl(var(--primary))' }
  ];

  const badges = [
    { id: 'first_blood', name: 'First Blood', desc: 'Complete your first objective', icon: <Target />, earned: (stats?.total_tasks_completed || 0) > 0 },
    { id: 'streak_7', name: 'Consistency', desc: 'Reach a 7-day streak', icon: <Flame />, earned: (stats?.longest_streak || 0) >= 7 },
    { id: 'streak_30', name: 'Unbreakable', desc: 'Reach a 30-day streak', icon: <Shield />, earned: (stats?.longest_streak || 0) >= 30 },
    { id: 'score_50', name: 'Ascension', desc: 'Reach 50+ Discipline Score', icon: <Zap />, earned: (stats?.discipline_score || 0) >= 50 },
    { id: 'score_100', name: 'Perfection', desc: 'Reach 100 Discipline Score', icon: <Trophy />, earned: (stats?.discipline_score || 0) >= 100 },
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-white">Insights & Honors</h1>
        <p className="text-muted-foreground uppercase tracking-widest text-xs mt-2 font-semibold">
          Gamification & Milestones
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Progression */}
        <div className="glass rounded-3xl p-8 flex flex-col items-center justify-center text-center">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">Rank Progression</h2>
          
          <div className="w-48 h-48 relative mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" cy="50%" 
                innerRadius="80%" outerRadius="100%" 
                barSize={10} 
                data={progressData} 
                startAngle={90} endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={10} className="glow-purple" />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black glow-text">{Math.round(progressToNext)}%</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-white font-semibold">Current: <span className="text-primary">{stats?.level || "Unranked"}</span></p>
            {currentScore < 80 ? (
              <p className="text-sm text-muted-foreground">
                {Math.ceil(nextThreshold - currentScore)} points to <span className="text-white font-medium">{nextLevel}</span>
              </p>
            ) : (
              <p className="text-sm text-primary">Maximum Rank Achieved</p>
            )}
          </div>
        </div>

        {/* Momentum & Advice */}
        <div className="space-y-6">
          <div className="glass rounded-3xl p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" /> Momentum Engine
            </h2>
            <div className="flex items-end gap-4">
              <div className="text-6xl font-black text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                {stats?.momentum_score ? Math.round(stats.momentum_score) : 0}
              </div>
              <div className="pb-2 text-sm text-muted-foreground">
                Momentum acts as a multiplier to your Discipline Score gains. Maintain streaks to build momentum.
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tactical Advice</h3>
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-sm">
                {(stats?.current_streak || 0) < 3 ? "String 3 days together to activate momentum multipliers." :
                 (stats?.weekly_completion_pct || 0) < 50 ? "Focus on consistency. Better to complete 1 task every day than 5 tasks once a week." :
                 "Momentum is high. Increase objective complexity to maximize score gains."}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Honor Archive</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {badges.map(badge => (
            <div 
              key={badge.id} 
              className={`glass rounded-2xl p-6 flex flex-col items-center text-center transition-all ${
                badge.earned ? "glow-purple border-primary/30" : "opacity-40 grayscale"
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                badge.earned ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"
              }`}>
                {badge.earned ? badge.icon : <Lock className="w-5 h-5" />}
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{badge.name}</h3>
              <p className="text-[10px] text-muted-foreground">{badge.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
