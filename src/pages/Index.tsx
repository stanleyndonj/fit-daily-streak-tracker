
import React from 'react';
import { useWorkout } from '@/context/WorkoutContext';
import Header from '@/components/Header';
import WorkoutList from '@/components/WorkoutList';
import StreakCalendar from '@/components/StreakCalendar';
import StatsSummary from '@/components/StatsSummary';
import StepTracker from '@/components/StepTracker';
import BackupRestore from '@/components/BackupRestore';
import { Button } from '@/components/ui/button';
import { formatDateToYYYYMMDD } from '@/lib/workout-utils';
import { Repeat, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { resetDailyProgress } = useWorkout();
  const navigate = useNavigate();
  const today = new Date();
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      
      <main className="flex-1 container max-w-6xl py-6 px-4">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold dark:text-gray-100">Welcome to FitDaily</h1>
              <p className="text-muted-foreground dark:text-gray-400">
                {formatDateToYYYYMMDD(today)} • Keep your streak going!
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="shrink-0 dark:border-gray-700 dark:hover:bg-gray-800"
                onClick={() => {
                  if (confirm('Are you sure you want to reset today\'s progress?')) {
                    resetDailyProgress();
                  }
                }}
              >
                <Repeat className="h-4 w-4 mr-2" /> Reset Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 dark:border-gray-700 dark:hover:bg-gray-800"
                onClick={() => navigate('/settings')}
              >
                <Settings className="h-4 w-4 mr-2" /> Settings
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <WorkoutList />
            </div>
            <div className="lg:col-span-1">
              <StepTracker />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <StreakCalendar />
            </div>
            <div className="lg:col-span-2">
              <StatsSummary />
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <BackupRestore />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
