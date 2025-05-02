
import React from 'react';
import { useWorkout } from '@/context/WorkoutContext';
import { CalendarCheck, Trophy, Gift } from 'lucide-react';

const Header: React.FC = () => {
  const { streakData } = useWorkout();

  return (
    <header className="flex flex-col md:flex-row justify-between items-center p-4 border-b bg-white dark:bg-gray-900">
      <div className="flex items-center mb-4 md:mb-0">
        <div className="mr-3 p-2 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg">
          <CalendarCheck className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold">FitDaily</h1>
      </div>
      
      <div className="flex space-x-4">
        <div className="flex items-center bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-full px-3 py-1">
          <Trophy className="h-4 w-4 text-amber-500 mr-2" />
          <div>
            <span className="text-sm font-medium">Current Streak: </span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
              {streakData.currentStreak} days
            </span>
          </div>
        </div>
        
        <div className="flex items-center bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-full px-3 py-1">
          <Gift className="h-4 w-4 text-purple-500 mr-2" />
          <div>
            <span className="text-sm font-medium">Best: </span>
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
              {streakData.longestStreak} days
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
