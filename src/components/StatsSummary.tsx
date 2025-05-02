
import React, { useMemo } from 'react';
import { useWorkout } from '@/context/WorkoutContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';
import { CalendarDays, Trophy, TrendingUp } from 'lucide-react';

const StatsSummary: React.FC = () => {
  const { completions, streakData } = useWorkout();
  
  const weeklyData = useMemo(() => {
    const today = new Date();
    const startDay = startOfWeek(today, { weekStartsOn: 1 }); // Week starts on Monday
    const endDay = endOfWeek(today, { weekStartsOn: 1 });
    
    const weekDays = eachDayOfInterval({ start: startDay, end: endDay });
    
    return weekDays.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayCompletions = completions.filter(c => c.date === dateStr);
      
      return {
        name: format(day, 'EEE'),
        date: dateStr,
        count: dayCompletions.length,
        exercises: dayCompletions.reduce((sum, c) => sum + c.completedExercises.length, 0)
      };
    });
  }, [completions]);
  
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border p-2 rounded-md shadow-md text-xs">
          <p className="font-medium">{format(parseISO(data.date), 'EEEE, MMM d')}</p>
          <p>Workouts: {data.count}</p>
          <p>Exercises: {data.exercises}</p>
        </div>
      );
    }
    return null;
  };
  
  const totalWorkouts = completions.length;
  const totalExercises = completions.reduce(
    (sum, c) => sum + c.completedExercises.length, 0
  );
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="col-span-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary" />
            Weekly Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip content={customTooltip} />
              <Bar 
                dataKey="exercises" 
                name="Exercises" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <CalendarDays className="h-5 w-5 mr-2 text-primary" />
            Activity Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Total Workouts</dt>
              <dd className="text-2xl font-semibold">{totalWorkouts}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Exercises Completed</dt>
              <dd className="text-2xl font-semibold">{totalExercises}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Active Days</dt>
              <dd className="text-2xl font-semibold">{streakData.streakDates.length}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-primary" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mr-3">
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <div className="font-medium">Current Streak</div>
                <div className="text-2xl font-bold">{streakData.currentStreak} days</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                <Trophy className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="font-medium">Longest Streak</div>
                <div className="text-2xl font-bold">{streakData.longestStreak} days</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsSummary;
