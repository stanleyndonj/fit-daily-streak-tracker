
import React from 'react';
import { useWorkout } from '@/context/WorkoutContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth, isToday } from 'date-fns';

const StreakCalendar: React.FC = () => {
  const { streakData } = useWorkout();
  const today = new Date();
  const startDay = startOfMonth(today);
  const endDay = endOfMonth(today);
  
  const days = eachDayOfInterval({ start: startDay, end: endDay });
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{format(today, 'MMMM yyyy')} Activity</CardTitle>
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
                  h-8 flex items-center justify-center text-xs rounded-full
                  ${isCurrentDay ? 'border border-primary' : ''}
                  ${isActiveDay 
                    ? 'bg-primary/90 text-primary-foreground' 
                    : 'hover:bg-muted/40'}
                `}
              >
                {format(day, 'd')}
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm">
          <div>
            <span className="font-medium">{streakData.streakDates.length}</span>
            <span className="text-muted-foreground ml-1">active days this month</span>
          </div>
          {streakData.currentStreak > 0 && (
            <div className="streak-badge animate-pulse-scale">
              {streakData.currentStreak} day streak!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StreakCalendar;
