
import React, { useState } from 'react';
import { useWorkout } from '@/context/WorkoutContext';
import { useAchievement } from '@/context/AchievementContext';
import Header from '@/components/Header';
import WorkoutList from '@/components/WorkoutList';
import StreakCalendar from '@/components/StreakCalendar';
import StatsSummary from '@/components/StatsSummary';
import StepTracker from '@/components/StepTracker';
import BackupRestore from '@/components/BackupRestore';
import ExerciseHistory from '@/components/ExerciseHistory';
import BadgesAchievement from '@/components/BadgesAchievement';
import WeeklyGoalTracker from '@/components/WeeklyGoalTracker';
import { Button } from '@/components/ui/button';
import { formatDateToYYYYMMDD } from '@/lib/workout-utils';
import { Repeat, Settings, List, Award, Calendar, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const { resetDailyProgress } = useWorkout();
  const { exportToCSV } = useAchievement();
  const navigate = useNavigate();
  const today = new Date();
  const [activeTab, setActiveTab] = useState<string>('workouts');
  
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
            <div className="flex flex-wrap gap-2">
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
          
          {/* Mobile tabs for better navigation on small screens */}
          <div className="md:hidden">
            <Tabs defaultValue="workouts" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="workouts"><List className="h-4 w-4 mr-1" /> Workouts</TabsTrigger>
                <TabsTrigger value="goals"><Award className="h-4 w-4 mr-1" /> Goals</TabsTrigger>
                <TabsTrigger value="stats"><Calendar className="h-4 w-4 mr-1" /> Stats</TabsTrigger>
                <TabsTrigger value="history"><CalendarDays className="h-4 w-4 mr-1" /> History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="workouts" className="space-y-6 mt-4">
                <WorkoutList />
                <StepTracker />
              </TabsContent>
              
              <TabsContent value="goals" className="space-y-6 mt-4">
                <WeeklyGoalTracker />
                <BadgesAchievement />
              </TabsContent>
              
              <TabsContent value="stats" className="space-y-6 mt-4">
                <StreakCalendar />
                <StatsSummary />
              </TabsContent>
              
              <TabsContent value="history" className="space-y-6 mt-4">
                <ExerciseHistory />
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={exportToCSV}>
                    <Calendar className="h-4 w-4 mr-2" /> Export History
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Desktop layout */}
          <div className="hidden md:block">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <WorkoutList />
              </div>
              <div className="lg:col-span-1">
                <div className="space-y-6">
                  <WeeklyGoalTracker />
                  <StepTracker />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="lg:col-span-1">
                <StreakCalendar />
              </div>
              <div className="lg:col-span-2">
                <StatsSummary />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <BadgesAchievement />
              <ExerciseHistory />
            </div>
            
            <div className="grid grid-cols-1 gap-6 mt-6">
              <BackupRestore />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
