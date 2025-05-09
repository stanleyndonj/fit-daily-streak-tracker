
import React from 'react';
import { useWorkout } from '@/context/WorkoutContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth, isToday } from 'date-fns';
import { Calendar, Flame } from 'lucide-react';

const StreakCalendar: React.FC = () => {
  const { streakData } = useWorkout();
  const today = new Date();
  const startDay = startOfMonth(today);
  const endDay = endOfMonth(today);
  
  const days = eachDayOfInterval({ start: startDay, end: endDay });
  
  // Animated flame sizes based on streak length
  const getFlameSize = (streak: number): number => {
    if (streak <= 0) return 0;
    if (streak < 3) return 12;
    if (streak < 7) return 16;
    if (streak < 14) return 20;
    if (streak < 30) return 24;
    return 28;
  };
  
  // Flame color based on streak length
  const getFlameColor = (streak: number): string => {
    if (streak < 3) return "text-orange-400";
    if (streak < 7) return "text-orange-500";
    if (streak < 14) return "text-orange-600";
    if (streak < 30) return "text-red-500";
    return "text-red-600";
  };
  
  return (
    <Card className="dashboard-card glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-accent" />
            {format(today, 'MMMM yyyy')}
          </CardTitle>
          <span className="text-xs text-muted-foreground rounded-full bg-muted px-2.5 py-0.5">
            {streakData.streakDates.length} active days
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <div 
              key={`header-${index}`} 
              className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
          
          {Array.from({ length: startDay.getDay() }).map((_, index) => (
            <div key={`empty-start-${index}`} className="h-8" />
          ))}
          
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isActiveDay = streakData.streakDates.includes(dateStr);
            const isCurrentDay = isToday(day);
            
            return (
              <div 
                key={dateStr}
                className={`
                  h-9 flex items-center justify-center text-xs rounded-full transition-all duration-200 relative
                  ${isCurrentDay ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                  ${isActiveDay 
                    ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-medium shadow-sm' 
                    : 'hover:bg-muted'}
                `}
              >
                {format(day, 'd')}
                {isActiveDay && (
                  <div className="absolute -top-1 -right-1 animate-bounce">
                    <span className="text-xs">🔥</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium">{streakData.streakDates.length}</span>
            <span className="text-muted-foreground ml-1">active days</span>
          </div>
          
          {streakData.currentStreak > 0 && (
            <div className="streak-badge flex items-center gap-1 animate-pulse-scale bg-gradient-to-r from-accent to-primary text-white">
              <span>{streakData.currentStreak} day streak!</span>
              <Flame 
                className={`${getFlameColor(streakData.currentStreak)} animate-pulse`}
                size={getFlameSize(streakData.currentStreak)}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StreakCalendar;
