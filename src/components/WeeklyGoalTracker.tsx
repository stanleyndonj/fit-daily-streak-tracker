import React from 'react';
import { useAchievement } from '@/context/AchievementContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Settings, Trophy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WeeklyGoalTracker = () => {
  const { currentWeeklyGoal } = useAchievement();
  const navigate = useNavigate();
  
  if (!currentWeeklyGoal) {
    return null;
  }

  const { startDate, endDate, targetWorkouts, completedWorkouts, isAchieved } = currentWeeklyGoal;
  const progress = Math.min(Math.round((completedWorkouts / targetWorkouts) * 100), 100);
  
  // Format date range
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
  
  const dateRange = `${formatDate(startDate)} - ${formatDate(endDate)}`;
  
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Weekly Goal</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>{dateRange}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-sm font-medium">Target: {targetWorkouts} workouts</p>
              <p className="text-sm text-muted-foreground">
                Completed: {completedWorkouts} workouts
              </p>
            </div>
            {isAchieved && (
              <div className="flex items-center text-green-600 dark:text-green-500">
                <Check className="mr-1 h-5 w-5" />
                <span className="font-medium">Achieved</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="pt-2">
            {isAchieved ? (
              <div className="flex items-center justify-center text-primary gap-2 p-2 rounded-md bg-primary/5 border border-primary/10">
                <Trophy className="h-5 w-5" />
                <p className="font-medium">Goal achieved for this week!</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                {targetWorkouts - completedWorkouts} more workout{targetWorkouts - completedWorkouts !== 1 ? 's' : ''} to reach your weekly goal
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyGoalTracker;
