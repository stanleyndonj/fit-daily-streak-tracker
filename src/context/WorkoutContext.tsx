
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

  // Load data from localStorage on initial render
  useEffect(() => {
    const storedWorkouts = loadWorkouts();
    const storedCompletions = loadCompletions();
    
    // If no workouts, create a sample workout for new users
    if (storedWorkouts.length === 0) {
      const sampleWorkout = createSampleWorkout();
      setWorkouts([sampleWorkout]);
      saveWorkouts([sampleWorkout]);
    } else {
      setWorkouts(storedWorkouts);
    }
    
    setCompletions(storedCompletions);
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

  // Delete a workout
  const deleteWorkout = (workoutId: string) => {
    const workoutToDelete = workouts.find(w => w.id === workoutId);
    const updatedWorkouts = workouts.filter(w => w.id !== workoutId);
    setWorkouts(updatedWorkouts);
    saveWorkouts(updatedWorkouts);
    
    // Also remove related completions
    const updatedCompletions = completions.filter(c => c.workoutId !== workoutId);
    setCompletions(updatedCompletions);
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

  // Toggle exercise completion status
  const toggleExerciseCompletion = (workoutId: string, exerciseId: string) => {
    const today = formatDateToYYYYMMDD(new Date());
    const existingCompletion = completions.find(c => c.workoutId === workoutId && c.date === today);
    
    if (existingCompletion) {
      // Toggle exercise completion status
      const isCompleted = existingCompletion.completedExercises.includes(exerciseId);
      const updatedCompletions = completions.map(completion => {
        if (completion.id === existingCompletion.id) {
          return {
            ...completion,
            completedExercises: isCompleted
              ? completion.completedExercises.filter(id => id !== exerciseId)
              : [...completion.completedExercises, exerciseId]
          };
        }
        return completion;
      });
      
      setCompletions(updatedCompletions);
      saveCompletions(updatedCompletions);
    } else {
      // Create a new completion record
      const newCompletion: WorkoutCompletion = {
        id: generateId(),
        workoutId,
        date: today,
        completedExercises: [exerciseId]
      };
      
      const updatedCompletions = [...completions, newCompletion];
      setCompletions(updatedCompletions);
      saveCompletions(updatedCompletions);
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
