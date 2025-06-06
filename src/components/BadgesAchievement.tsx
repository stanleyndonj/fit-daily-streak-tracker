import React from 'react';
import { useAchievement } from '@/context/AchievementContext';
import { useWorkout } from '@/context/WorkoutContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge as UIBadge } from '@/components/ui/badge';
import { 
  Flame, Dumbbell, Sunrise, Trophy, Clock, Lock
} from 'lucide-react';

const BadgesAchievement = () => {
  const { badges } = useAchievement();
  const { streakData } = useWorkout();
  
  // Map badge icon names to actual components
  const getIconComponent = (iconName: string, className = "h-5 w-5") => {
    switch (iconName) {
      case 'flame':
        return <Flame className={className} />;
      case 'dumbbell':
        return <Dumbbell className={className} />;
      case 'sunrise':
        return <Sunrise className={className} />;
      case 'trophy':
        return <Trophy className={className} />;
      case 'clock':
        return <Clock className={className} />;
      default:
        return <Trophy className={className} />;
    }
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" /> Achievements
        </CardTitle>
        <CardDescription>Unlock badges by hitting fitness milestones</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {badges.map(badge => (
            <div 
              key={badge.id}
              className={`flex flex-col items-center justify-between p-4 rounded-lg border ${
                badge.unlocked 
                  ? 'bg-primary/5 border-primary/20' 
                  : 'bg-muted/30 border-muted text-muted-foreground'
              }`}
            >
              <div className="relative">
                <div className={`flex items-center justify-center h-16 w-16 rounded-full ${
                  badge.unlocked ? 'bg-primary/10' : 'bg-muted/10'
                }`}>
                  {getIconComponent(badge.icon, "h-8 w-8")}
                </div>
                {!badge.unlocked && (
                  <div className="absolute -bottom-1 -right-1 bg-muted-foreground/30 rounded-full p-1">
                    <Lock className="h-4 w-4" />
                  </div>
                )}
              </div>
              
              <div className="mt-3 text-center">
                <h3 className="font-medium">{badge.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{badge.description}</p>
                
                {badge.unlocked ? (
                  <UIBadge variant="default" className="mt-2">
                    Unlocked
                    {badge.earnedDate && ` • ${new Date(badge.earnedDate).toLocaleDateString()}`}
                  </UIBadge>
                ) : (
                  <div className="mt-2">
                    {badge.id === 'streak-5' && (
                      <p className="text-xs">Current streak: {streakData.currentStreak}/{badge.requirement} days</p>
                    )}
                    {badge.id === 'exercises-10' && (
                      <p className="text-xs">Progress shown in stats</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BadgesAchievement;
