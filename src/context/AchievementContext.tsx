import React, { createContext, useContext, useState, useEffect } from 'react';
import { Badge, ExerciseCompletion, WeeklyGoal } from '@/types';
import { useWorkout } from './WorkoutContext';
import { formatDateToYYYYMMDD, generateId } from '@/lib/workout-utils';
import { toast } from 'sonner';

// Define the structure of our context
interface AchievementContextType {
  badges: Badge[];
  exerciseHistory: ExerciseCompletion[];
  weeklyGoals: WeeklyGoal[];
  currentWeeklyGoal: WeeklyGoal | null;
  addExerciseCompletion: (completion: Omit<ExerciseCompletion, 'id'>) => void;
  setWeeklyGoalTarget: (target: number) => void;
  exportToCSV: () => void;
  checkAndUnlockBadges: () => void;
}

// Create the context
const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

// Default badges
const DEFAULT_BADGES: Badge[] = [
  {
    id: 'streak-5',
    name: '5-Day Streak',
    description: 'Complete your exercises for 5 days in a row',
    icon: 'flame',
    unlocked: false,
    type: 'streak',
    requirement: 5,
  },
  {
    id: 'exercises-10',
    name: 'Exercise Variety',
    description: 'Complete 10 unique exercises',
    icon: 'dumbbell',
    unlocked: false,
    type: 'exercise',
    requirement: 10,
  },
  {
    id: 'early-bird',
    name: '7 AM Warrior',
    description: 'Complete an exercise before 7 AM',
    icon: 'sunrise',
    unlocked: false,
    type: 'time',
    requirement: 7, // 7 AM
  },
];

// Helper function to save badges to local storage
const saveBadges = (badges: Badge[]) => {
  localStorage.setItem('fit-daily-badges', JSON.stringify(badges));
};

// Helper function to load badges from local storage
const loadBadges = (): Badge[] => {
  const stored = localStorage.getItem('fit-daily-badges');
  if (!stored) return DEFAULT_BADGES;
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse badges from localStorage', e);
    return DEFAULT_BADGES;
  }
};

// Helper function to save exercise history to local storage
const saveExerciseHistory = (history: ExerciseCompletion[]) => {
  localStorage.setItem('fit-daily-exercise-history', JSON.stringify(history));
};

// Helper function to load exercise history from local storage
const loadExerciseHistory = (): ExerciseCompletion[] => {
  const stored = localStorage.getItem('fit-daily-exercise-history');
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse exercise history from localStorage', e);
    return [];
  }
};

// Helper function to save weekly goals to local storage
const saveWeeklyGoals = (goals: WeeklyGoal[]) => {
  localStorage.setItem('fit-daily-weekly-goals', JSON.stringify(goals));
};

// Helper function to load weekly goals from local storage
const loadWeeklyGoals = (): WeeklyGoal[] => {
  const stored = localStorage.getItem('fit-daily-weekly-goals');
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse weekly goals from localStorage', e);
    return [];
  }
};

// Helper to get the start and end dates of the current week
const getCurrentWeekDates = (): { startDate: string; endDate: string } => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
  
  // Calculate start of week (Sunday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  
  // Calculate end of week (Saturday)
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (6 - dayOfWeek));
  
  return {
    startDate: formatDateToYYYYMMDD(startOfWeek),
    endDate: formatDateToYYYYMMDD(endOfWeek),
  };
};

// Provider component
export const AchievementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { workouts, completions, streakData } = useWorkout();
  const [badges, setBadges] = useState<Badge[]>(loadBadges());
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseCompletion[]>(loadExerciseHistory());
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>(loadWeeklyGoals());
  const [currentWeeklyGoal, setCurrentWeeklyGoal] = useState<WeeklyGoal | null>(null);
  
  // Listen for exercise completion events from WorkoutContext
  useEffect(() => {
    const handleExerciseCompleted = (event: CustomEvent) => {
      const { workoutId, exerciseId, date, timestamp } = event.detail;
      console.log('Exercise completed event received:', event.detail);
      
      // Find the workout and exercise details
      const workout = workouts.find(w => w.id === workoutId);
      const exercise = workout?.exercises.find(e => e.id === exerciseId);
      
      if (workout && exercise) {
        // Create a new exercise completion record
        const newCompletion: ExerciseCompletion = {
          id: generateId(),
          exerciseId,
          workoutId,
          date,
          timestamp,
          sets: exercise.sets,
          reps: exercise.type === 'reps' ? exercise.target : undefined,
          time: exercise.type === 'time' ? exercise.target : undefined,
          distance: exercise.type === 'distance' ? exercise.target : undefined
        };
        
        // Update the exercise history
        const updatedHistory = [...exerciseHistory, newCompletion];
        setExerciseHistory(updatedHistory);
        saveExerciseHistory(updatedHistory);
      }
    };
    
    const handleExerciseUncompleted = (event: CustomEvent) => {
      const { workoutId, exerciseId, date } = event.detail;
      console.log('Exercise uncompleted event received:', event.detail);
      
      // Remove the exercise completion record from history
      const updatedHistory = exerciseHistory.filter(completion => 
        !(completion.exerciseId === exerciseId && completion.workoutId === workoutId && completion.date === date)
      );
      
      // Only update if something changed
      if (updatedHistory.length !== exerciseHistory.length) {
        setExerciseHistory(updatedHistory);
        saveExerciseHistory(updatedHistory);
      }
    };
    
    // Add event listeners
    window.addEventListener('exercise-completed', handleExerciseCompleted as EventListener);
    window.addEventListener('exercise-uncompleted', handleExerciseUncompleted as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('exercise-completed', handleExerciseCompleted as EventListener);
      window.removeEventListener('exercise-uncompleted', handleExerciseUncompleted as EventListener);
    };
  }, [workouts, exerciseHistory]);

  // Initialize or update weekly goal on load and when a new week starts
  useEffect(() => {
    const { startDate, endDate } = getCurrentWeekDates();
    
    // Check if we have a goal for the current week
    let existingGoal = weeklyGoals.find(
      goal => goal.startDate === startDate && goal.endDate === endDate
    );
    
    if (!existingGoal) {
      // Get the target from the most recent goal, or default to 4
      const targetWorkouts = weeklyGoals.length > 0 
        ? weeklyGoals[weeklyGoals.length - 1].targetWorkouts 
        : 4;
      
      existingGoal = {
        id: generateId(),
        targetWorkouts,
        startDate,
        endDate,
        completedWorkouts: 0,
        isAchieved: false,
      };
      
      const updatedGoals = [...weeklyGoals, existingGoal];
      setWeeklyGoals(updatedGoals);
      saveWeeklyGoals(updatedGoals);
    }
    
    setCurrentWeeklyGoal(existingGoal);
  }, [weeklyGoals]);

  // Update the weekly goal progress when completions change
  useEffect(() => {
    if (!currentWeeklyGoal) return;
    
    // Count workouts completed in the current week
    const workoutsThisWeek = completions.filter(completion => {
      return completion.date >= currentWeeklyGoal.startDate && 
             completion.date <= currentWeeklyGoal.endDate;
    });
    
    // Get unique workout IDs (a workout might have multiple completion records in a week)
    const uniqueWorkoutIds = new Set(workoutsThisWeek.map(w => w.workoutId)).size;
    const isAchieved = uniqueWorkoutIds >= currentWeeklyGoal.targetWorkouts;
    
    // Only update if the value has changed
    if (uniqueWorkoutIds !== currentWeeklyGoal.completedWorkouts || isAchieved !== currentWeeklyGoal.isAchieved) {
      const updatedGoal = {
        ...currentWeeklyGoal,
        completedWorkouts: uniqueWorkoutIds,
        isAchieved,
      };
      
      const updatedGoals = weeklyGoals.map(goal => 
        goal.id === currentWeeklyGoal.id ? updatedGoal : goal
      );
      
      setWeeklyGoals(updatedGoals);
      setCurrentWeeklyGoal(updatedGoal);
      saveWeeklyGoals(updatedGoals);
      
      // Notify the user if they've achieved their weekly goal
      if (isAchieved && !currentWeeklyGoal.isAchieved) {
        toast.success('Weekly goal achieved! 🎉');
      }
    }
  }, [completions, currentWeeklyGoal, weeklyGoals]);

  // Check and unlock badges when relevant data changes
  useEffect(() => {
    checkAndUnlockBadges();
  }, [streakData, exerciseHistory, completions]);
  
  // Check for badges on initial load
  useEffect(() => {
    checkAndUnlockBadges();
  }, []);

  // Add an exercise completion to history
  const addExerciseCompletion = (completion: Omit<ExerciseCompletion, 'id'>) => {
    const newCompletion: ExerciseCompletion = {
      ...completion,
      id: generateId(),
    };
    
    const updatedHistory = [...exerciseHistory, newCompletion];
    setExerciseHistory(updatedHistory);
    saveExerciseHistory(updatedHistory);
  };

  // Set the weekly goal target
  const setWeeklyGoalTarget = (target: number) => {
    if (!currentWeeklyGoal) return;
    
    const updatedGoal = {
      ...currentWeeklyGoal,
      targetWorkouts: target,
    };
    
    const updatedGoals = weeklyGoals.map(goal => 
      goal.id === currentWeeklyGoal.id ? updatedGoal : goal
    );
    
    setWeeklyGoals(updatedGoals);
    setCurrentWeeklyGoal(updatedGoal);
    saveWeeklyGoals(updatedGoals);
    toast.success(`Weekly goal updated to ${target} workouts`);
  };

  // Check and unlock badges based on achievements
  const checkAndUnlockBadges = () => {
    let updated = false;
    const updatedBadges = badges.map(badge => {
      // Skip already unlocked badges
      if (badge.unlocked) return badge;
      
      let shouldUnlock = false;
      
      switch (badge.id) {
        case 'streak-5':
          shouldUnlock = streakData.currentStreak >= 5;
          break;
          
        case 'exercises-10':
          // Count unique exercises completed
          const uniqueExercises = new Set();
          completions.forEach(completion => {
            completion.completedExercises.forEach(exerciseId => {
              uniqueExercises.add(exerciseId);
            });
          });
          shouldUnlock = uniqueExercises.size >= 10;
          break;
          
        case 'early-bird':
          // Check if any exercise was completed before 7 AM
          shouldUnlock = exerciseHistory.some(completion => {
            if (!completion.timestamp) return false;
            const completionTime = new Date(completion.timestamp);
            return completionTime.getHours() < 7;
          });
          break;
      }
      
      if (shouldUnlock && !badge.unlocked) {
        updated = true;
        return {
          ...badge,
          unlocked: true,
          earnedDate: new Date().toISOString(),
        };
      }
      
      return badge;
    });
    
    if (updated) {
      setBadges(updatedBadges);
      saveBadges(updatedBadges);
      toast.success('You earned a new badge! 🏆');
    }
  };

  // Export exercise history to CSV
  const exportToCSV = () => {
    // Prepare the data
    const csvRows = [];
    
    // Add header row
    csvRows.push(['Date', 'Exercise Name', 'Workout Name', 'Time', 'Sets', 'Reps', 'Distance']);
    
    // Add data rows
    exerciseHistory.forEach(completion => {
      const workout = workouts.find(w => w.id === completion.workoutId);
      const exercise = workout?.exercises.find(e => e.id === completion.exerciseId);
      
      if (workout && exercise) {
        csvRows.push([
          completion.date,
          exercise.name,
          workout.name,
          completion.timestamp ? new Date(completion.timestamp).toLocaleTimeString() : '',
          completion.sets || exercise.sets,
          completion.reps || (exercise.type === 'reps' ? exercise.target : ''),
          completion.distance || (exercise.type === 'distance' ? exercise.target : ''),
        ]);
      }
    });
    
    // Convert to CSV format
    const csvContent = "data:text/csv;charset=utf-8," + 
      csvRows.map(row => row.join(',')).join('\n');
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fitdaily-history-${formatDateToYYYYMMDD(new Date())}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    document.body.removeChild(link);
    
    toast.success('Exercise history exported to CSV');
  };

  const value = {
    badges,
    exerciseHistory,
    weeklyGoals,
    currentWeeklyGoal,
    addExerciseCompletion,
    setWeeklyGoalTarget,
    exportToCSV,
    checkAndUnlockBadges,
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
};

// Custom hook to use the achievement context
export const useAchievement = () => {
  const context = useContext(AchievementContext);
  if (context === undefined) {
    throw new Error('useAchievement must be used within an AchievementProvider');
  }
  return context;
};
