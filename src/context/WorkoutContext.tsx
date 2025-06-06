import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";
import { Exercise, Workout, WorkoutCompletion, StreakData } from '@/types';
import { 
  loadWorkouts, 
  loadCompletions, 
  saveWorkouts, 
  saveCompletions, 
  generateId, 
  formatDateToYYYYMMDD,
  calculateStreakData,
  createSampleWorkout
} from '@/lib/workout-utils';

interface WorkoutContextType {
  workouts: Workout[];
  completions: WorkoutCompletion[];
  streakData: StreakData;
  addWorkout: (workout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateWorkout: (workout: Workout) => void;
  deleteWorkout: (workoutId: string) => void;
  addExercise: (workoutId: string, exercise: Omit<Exercise, 'id'>) => void;
  updateExercise: (workoutId: string, exercise: Exercise) => void;
  deleteExercise: (workoutId: string, exerciseId: string) => void;
  toggleExerciseCompletion: (workoutId: string, exerciseId: string) => void;
  updateWorkoutNote: (completionId: string, note: string) => void;
  resetDailyProgress: () => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [completions, setCompletions] = useState<WorkoutCompletion[]>([]);
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastCompletionDate: null,
    streakDates: []
  });
  
  // Track if this is the first load to determine if we should create a sample workout
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Load data from localStorage on initial render
  useEffect(() => {
    const storedWorkouts = loadWorkouts();
    const storedCompletions = loadCompletions();
    
    // Only create a sample workout for first-time users
    // Check localStorage for a flag indicating if the app has been used before
    const hasUsedBefore = localStorage.getItem('fit-daily-first-launch');
    
    if (storedWorkouts.length === 0 && !hasUsedBefore) {
      // First time users - create sample workout
      const sampleWorkout = createSampleWorkout();
      setWorkouts([sampleWorkout]);
      saveWorkouts([sampleWorkout]);
      // Set the flag to indicate app has been used before
      localStorage.setItem('fit-daily-first-launch', 'true');
    } else {
      // Returning users - just load their workouts
      setWorkouts(storedWorkouts);
    }
    
    setCompletions(storedCompletions);
    setIsFirstLoad(false);
  }, []);

  // Update streak data whenever completions change
  useEffect(() => {
    const newStreakData = calculateStreakData(completions);
    setStreakData(newStreakData);
  }, [completions]);

  // Add a new workout
  const addWorkout = (workout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newWorkout: Workout = {
      ...workout,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    };
    
    const updatedWorkouts = [...workouts, newWorkout];
    setWorkouts(updatedWorkouts);
    saveWorkouts(updatedWorkouts);
    toast.success(`Created workout: ${workout.name}`);
  };

  // Update an existing workout
  const updateWorkout = (workout: Workout) => {
    const updatedWorkouts = workouts.map(w => 
      w.id === workout.id ? { ...workout, updatedAt: new Date().toISOString() } : w
    );
    setWorkouts(updatedWorkouts);
    saveWorkouts(updatedWorkouts);
    toast.success(`Updated workout: ${workout.name}`);
  };

  // Delete a workout - Ensure it's properly removed from localStorage too
  const deleteWorkout = (workoutId: string) => {
    const workoutToDelete = workouts.find(w => w.id === workoutId);
    if (!workoutToDelete) return;

    const updatedWorkouts = workouts.filter(w => w.id !== workoutId);
    
    // Update workouts state
    setWorkouts(updatedWorkouts);
    
    // Immediately save to localStorage to ensure persistence
    saveWorkouts(updatedWorkouts);
    
    // Also remove related completions
    const updatedCompletions = completions.filter(c => c.workoutId !== workoutId);
    setCompletions(updatedCompletions);
    
    // Save updated completions to localStorage
    saveCompletions(updatedCompletions);
    
    toast.success(`Deleted workout: ${workoutToDelete?.name || 'Workout'}`);
  };

  // Add an exercise to a workout
  const addExercise = (workoutId: string, exercise: Omit<Exercise, 'id'>) => {
    const newExercise: Exercise = {
      ...exercise,
      id: generateId()
    };
    
    const updatedWorkouts = workouts.map(workout => {
      if (workout.id === workoutId) {
        return {
          ...workout,
          exercises: [...workout.exercises, newExercise],
          updatedAt: new Date().toISOString()
        };
      }
      return workout;
    });
    
    setWorkouts(updatedWorkouts);
    saveWorkouts(updatedWorkouts);
    toast.success(`Added ${exercise.name} to workout`);
  };

  // Update an exercise
  const updateExercise = (workoutId: string, exercise: Exercise) => {
    const updatedWorkouts = workouts.map(workout => {
      if (workout.id === workoutId) {
        return {
          ...workout,
          exercises: workout.exercises.map(e => 
            e.id === exercise.id ? exercise : e
          ),
          updatedAt: new Date().toISOString()
        };
      }
      return workout;
    });
    
    setWorkouts(updatedWorkouts);
    saveWorkouts(updatedWorkouts);
    toast.success(`Updated exercise: ${exercise.name}`);
  };

  // Delete an exercise
  const deleteExercise = (workoutId: string, exerciseId: string) => {
    const workout = workouts.find(w => w.id === workoutId);
    const exerciseToDelete = workout?.exercises.find(e => e.id === exerciseId);
    
    const updatedWorkouts = workouts.map(workout => {
      if (workout.id === workoutId) {
        return {
          ...workout,
          exercises: workout.exercises.filter(e => e.id !== exerciseId),
          updatedAt: new Date().toISOString()
        };
      }
      return workout;
    });
    
    setWorkouts(updatedWorkouts);
    saveWorkouts(updatedWorkouts);
    
    // Also update completions to remove this exercise
    const updatedCompletions = completions.map(completion => {
      if (completion.workoutId === workoutId) {
        return {
          ...completion,
          completedExercises: completion.completedExercises.filter(id => id !== exerciseId)
        };
      }
      return completion;
    });
    
    setCompletions(updatedCompletions);
    saveCompletions(updatedCompletions);
    
    toast.success(`Removed ${exerciseToDelete?.name || 'exercise'} from workout`);
  };

  // Update workout note
  const updateWorkoutNote = (completionId: string, note: string) => {
    const updatedCompletions = completions.map(completion => {
      if (completion.id === completionId) {
        return {
          ...completion,
          notes: note
        };
      }
      return completion;
    });
    
    setCompletions(updatedCompletions);
    saveCompletions(updatedCompletions);
  };

  // Toggle exercise completion status - improved with better validation
  const toggleExerciseCompletion = (workoutId: string, exerciseId: string) => {
    // Enhanced validation to catch any potential issues
    if (!workoutId) {
      console.error("Invalid workoutId:", workoutId);
      return;
    }
    
    if (!exerciseId) {
      console.error("Invalid exerciseId:", exerciseId);
      return;
    }
    
    console.log(`Processing toggle for exercise: ${exerciseId} in workout: ${workoutId}`);
    
    // Verify the workout and exercise actually exist
    const workoutExists = workouts.some(w => w.id === workoutId);
    if (!workoutExists) {
      console.error(`Workout with ID ${workoutId} does not exist`);
      return;
    }
    
    const workout = workouts.find(w => w.id === workoutId);
    const exerciseExists = workout?.exercises.some(e => e.id === exerciseId);
    if (!exerciseExists) {
      console.error(`Exercise with ID ${exerciseId} does not exist in workout ${workoutId}`);
      return;
    }
    
    const today = formatDateToYYYYMMDD(new Date());
    const timestamp = new Date().toISOString(); // Add timestamp for the current time
    
    // Find if we have an existing completion record for today's workout
    const existingCompletion = completions.find(
      c => c.workoutId === workoutId && c.date === today
    );
    
    if (existingCompletion) {
      // Check if this exercise is already marked as completed
      const isCompleted = existingCompletion.completedExercises.includes(exerciseId);
      console.log(`Exercise ${exerciseId} current completion status: ${isCompleted}`);
      
      if (isCompleted) {
        // If already completed, remove it from completions
        const updatedCompletions = completions.map(completion => {
          if (completion.id === existingCompletion.id) {
            const filteredExercises = completion.completedExercises.filter(id => id !== exerciseId);
            console.log(`Removing exercise ${exerciseId} from completions, remaining exercises:`, filteredExercises);
            
            // If no exercises remain completed, remove the entire completion entry
            if (filteredExercises.length === 0) {
              return null; // Mark for removal
            }
            
            return {
              ...completion,
              completedExercises: filteredExercises
            };
          }
          return completion;
        }).filter(Boolean) as WorkoutCompletion[]; // Remove null entries
        
        setCompletions(updatedCompletions);
        saveCompletions(updatedCompletions);
        console.log(`Removed exercise completion: ${exerciseId}, new completions count: ${updatedCompletions.length}`);
        
        // Dispatch custom event for other contexts to react to
        window.dispatchEvent(new CustomEvent('exercise-uncompleted', {
          detail: { workoutId, exerciseId, date: today }
        }));
      } else {
        // If not completed, add it to completions
        const updatedCompletions = completions.map(completion => {
          if (completion.id === existingCompletion.id) {
            const updatedExercises = [...completion.completedExercises, exerciseId];
            console.log(`Adding exercise ${exerciseId} to completions, new completed exercises:`, updatedExercises);
            
            return {
              ...completion,
              completedExercises: updatedExercises,
              timestamp // Add timestamp for history tracking
            };
          }
          return completion;
        });
        
        setCompletions(updatedCompletions);
        saveCompletions(updatedCompletions);
        console.log(`Added exercise completion: ${exerciseId}`);
        
        // Dispatch custom event for other contexts to react to
        // This will be used by the AchievementContext to track exercise completions
        window.dispatchEvent(new CustomEvent('exercise-completed', {
          detail: { workoutId, exerciseId, date: today, timestamp }
        }));
      }
    } else {
      // No existing completion record for today, create a new one
      const newCompletion: WorkoutCompletion = {
        id: generateId(),
        workoutId,
        date: today,
        completedExercises: [exerciseId],
        timestamp // Add timestamp for history tracking
      };
      
      console.log(`Creating new completion record with exercise: ${exerciseId}`, newCompletion);
      
      const updatedCompletions = [...completions, newCompletion];
      setCompletions(updatedCompletions);
      saveCompletions(updatedCompletions);
      
      // Dispatch custom event for other contexts to react to
      window.dispatchEvent(new CustomEvent('exercise-completed', {
        detail: { workoutId, exerciseId, date: today, timestamp }
      }));
    }
  };

  // Reset all progress for the current day
  const resetDailyProgress = () => {
    const today = formatDateToYYYYMMDD(new Date());
    const updatedCompletions = completions.filter(c => c.date !== today);
    
    setCompletions(updatedCompletions);
    saveCompletions(updatedCompletions);
    toast.success("Reset today's progress");
  };

  const value = {
    workouts,
    completions,
    streakData,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    addExercise,
    updateExercise,
    deleteExercise,
    toggleExerciseCompletion,
    updateWorkoutNote,
    resetDailyProgress
  };

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};
