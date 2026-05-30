export function calculateLevel(score: number): string {
  if (score <= 20) return "Beginner";
  if (score <= 40) return "Focused";
  if (score <= 60) return "Disciplined";
  if (score <= 80) return "Elite";
  return "Master";
}

export function calculateDisciplineScore(
  currentScore: number,
  tasksCompleted: number,
  tasksTotal: number,
  currentStreak: number,
  daysSinceActive: number
): number {
  if (tasksTotal === 0) {
    // Daily decay for inactivity
    const decay = daysSinceActive > 1 ? Math.min(3, daysSinceActive * 0.5) : 0;
    return Math.max(0, currentScore - decay);
  }
  const completionRate = tasksCompleted / tasksTotal;
  const streakBonus = Math.min(20, currentStreak * 0.5);
  const consistencyGain = completionRate * 8;
  const momentumMultiplier = currentStreak >= 7 ? 1.3 : currentStreak >= 3 ? 1.1 : 1.0;
  const gain = (consistencyGain + streakBonus * 0.2) * momentumMultiplier;
  const newScore = currentScore + (gain - currentScore * 0.02);
  return Math.min(100, Math.max(0, newScore));
}

export function calculateMomentumScore(streak: number, weeklyPct: number, disciplineScore: number): number {
  return Math.min(100, (streak * 2) + (weeklyPct * 0.5) + (disciplineScore * 0.3));
}
