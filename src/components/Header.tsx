
import React from 'react';
import { useWorkout } from '@/context/WorkoutContext';
import { CalendarCheck, Trophy, Gift, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const { streakData } = useWorkout();
  const navigate = useNavigate();

  return (
    <header className="app-header sticky top-0 z-10 flex flex-col md:flex-row justify-between items-center p-4 backdrop-blur-sm">
      <div 
        className="flex items-center mb-4 md:mb-0 cursor-pointer" 
        onClick={() => navigate('/')}
      >
        <div className="flex items-center justify-center mr-3 p-2 rounded-xl bg-white/20">
          <Flame className="h-6 w-6 text-white animate-pulse-scale" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tighter">FitDaily</h1>
      </div>
      
      <div className="flex space-x-4">
        <div className="flex items-center glass-card rounded-full px-4 py-1.5">
          <Trophy className="h-4 w-4 text-amber-500 mr-2" />
          <div>
            <span className="text-sm font-medium opacity-90">Current Streak: </span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
              {streakData.currentStreak} days
            </span>
          </div>
        </div>
        
        <div className="flex items-center glass-card rounded-full px-4 py-1.5">
          <Gift className="h-4 w-4 text-purple-500 mr-2" />
          <div>
            <span className="text-sm font-medium opacity-90">Best: </span>
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
