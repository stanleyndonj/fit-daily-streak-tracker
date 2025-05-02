
import React from 'react';
import { useWorkout } from '@/context/WorkoutContext';
import Header from '@/components/Header';
import WorkoutList from '@/components/WorkoutList';
import StreakCalendar from '@/components/StreakCalendar';
import StatsSummary from '@/components/StatsSummary';
import { Button } from '@/components/ui/button';
import { formatDateToYYYYMMDD } from '@/lib/workout-utils';
import { Repeat } from 'lucide-react';

const Index = () => {
  const { resetDailyProgress } = useWorkout();
  const today = new Date();
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      
      <main className="flex-1 container max-w-6xl py-6 px-4">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Welcome to FitDaily</h1>
              <p className="text-muted-foreground">
                {formatDateToYYYYMMDD(today)} • Keep your streak going!
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="shrink-0"
              onClick={() => {
                if (confirm('Are you sure you want to reset today\'s progress?')) {
                  resetDailyProgress();
                }
              }}
            >
              <Repeat className="h-4 w-4 mr-2" /> Reset Today
            </Button>
          </div>
          
          <WorkoutList />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <StreakCalendar />
            </div>
            <div className="lg:col-span-2">
              <StatsSummary />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
