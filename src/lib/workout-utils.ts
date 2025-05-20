import { Exercise, Workout, WorkoutCompletion, StreakData } from "@/types";
import { format, isToday, parseISO, differenceInDays, addDays, startOfDay } from "date-fns";

// Constants for steps tracking
export const STEPS_WORKOUT_ID = 'daily-steps-workout';
export const STEPS_EXERCISE_ID = 'daily-steps-exercise';

// Generate a unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Format date to YYYY-MM-DD
export const formatDateToYYYYMMDD = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

// Check if an exercise is completed on a given date
export const isExerciseCompleted = (
  exerciseId: string,
  completions: WorkoutCompletion[],
  date: string = formatDateToYYYYMMDD(new Date())
): boolean => {
  // Find any completion record for this date that includes the exerciseId
  const completion = completions.find(c => 
    c.date === date && c.completedExercises.includes(exerciseId)
  );
  return !!completion;
};

// Get completion percentage for a workout on a given date
export const getWorkoutCompletionPercentage = (
  workout: Workout,
  completions: WorkoutCompletion[],
  date: string = formatDateToYYYYMMDD(new Date())
): number => {
  const completion = completions.find(c => c.workoutId === workout.id && c.date === date);
  
  if (!completion) return 0;
  
  const totalExercises = workout.exercises.length;
  const completedExercises = completion.completedExercises.length;
  
  return totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;
};

// Calculate streak data
export const calculateStreakData = (completions: WorkoutCompletion[]): StreakData => {
  if (completions.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletionDate: null,
      streakDates: []
    };
  }

  // Sort completions by date (most recent first)
  const sortedDates = [...new Set(completions.map(c => c.date))]
    .sort((a, b) => parseISO(b).getTime() - parseISO(a).getTime());
  
  const today = formatDateToYYYYMMDD(new Date());
  const lastCompletionDate = sortedDates[0];
  
  // If last completion is not today or yesterday, streak is broken
  if (lastCompletionDate !== today && 
      differenceInDays(parseISO(today), parseISO(lastCompletionDate)) > 1) {
    return {
      currentStreak: 0,
      longestStreak: calculateLongestStreak(sortedDates),
      lastCompletionDate,
      streakDates: sortedDates
    };
  }
  
  // Calculate current streak
  let currentStreak = 1; // Start with 1 for the most recent day
  let currentDate = parseISO(lastCompletionDate);
  let i = 1; // Start from second item if it exists
  
  while (i < sortedDates.length) {
    const expectedPrevDate = formatDateToYYYYMMDD(addDays(currentDate, -1));
    
    if (sortedDates[i] === expectedPrevDate) {
      currentStreak++;
      currentDate = parseISO(expectedPrevDate);
      i++;
    } else {
      break; // Streak is broken
    }
  }
  
  const longestStreak = Math.max(currentStreak, calculateLongestStreak(sortedDates));
  
  return {
    currentStreak,
    longestStreak,
    lastCompletionDate,
    streakDates: sortedDates
  };
};

// Calculate longest streak from sorted dates
const calculateLongestStreak = (sortedDates: string[]): number => {
  if (sortedDates.length === 0) return 0;
  
  let longestStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < sortedDates.length; i++) {
    const currDate = parseISO(sortedDates[i-1]);
    const prevDate = parseISO(sortedDates[i]);
    
    if (differenceInDays(currDate, prevDate) === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  
  return longestStreak;
};

// Save data to localStorage
export const saveWorkouts = (workouts: Workout[]): void => {
  try {
    localStorage.setItem('fit-daily-workouts', JSON.stringify(workouts));
  } catch (error) {
    console.error('Failed to save workouts to localStorage:', error);
  }
};

export const saveCompletions = (completions: WorkoutCompletion[]): void => {
  try {
    localStorage.setItem('fit-daily-completions', JSON.stringify(completions));
  } catch (error) {
    console.error('Failed to save completions to localStorage:', error);
  }
};

// Load data from localStorage with steps workout integration
export const loadWorkouts = (): Workout[] => {
  try {
    const storedWorkouts = localStorage.getItem('fit-daily-workouts');
    let workouts = storedWorkouts ? JSON.parse(storedWorkouts) : [];
    
    // Ensure the steps workout exists
    workouts = ensureStepsWorkoutExists(workouts);
    
    return workouts;
  } catch (error) {
    console.error('Failed to load workouts from localStorage:', error);
    return [createStepsWorkout()];
  }
};

// Create the virtual workout for step tracking if it doesn't exist
export const ensureStepsWorkoutExists = (workouts: Workout[]): Workout[] => {
  // Check if the steps workout already exists
  const stepsWorkoutExists = workouts.some(w => w.id === STEPS_WORKOUT_ID);
  
  if (!stepsWorkoutExists) {
    const now = new Date().toISOString();
    const stepsWorkout: Workout = {
      id: STEPS_WORKOUT_ID,
      name: "Daily Step Goal",
      exercises: [
        {
          id: STEPS_EXERCISE_ID,
          name: "Reach Daily Step Goal",
          type: "reps",
          target: 0, // This is a placeholder, will use settings.dailyStepGoal
          sets: 1
        }
      ],
      createdAt: now,
      updatedAt: now
    };
    
    return [...workouts, stepsWorkout];
  }
  
  return workouts;
};

// Create a steps workout
export const createStepsWorkout = (): Workout => {
  const now = new Date().toISOString();
  return {
    id: STEPS_WORKOUT_ID,
    name: "Daily Step Goal",
    exercises: [
      {
        id: STEPS_EXERCISE_ID,
        name: "Reach Daily Step Goal",
        type: "reps",
        target: 0, // This is a placeholder, will use settings.dailyStepGoal
        sets: 1
      }
    ],
    createdAt: now,
    updatedAt: now
  };
};

// Load data from localStorage
export const loadCompletions = (): WorkoutCompletion[] => {
  try {
    const storedCompletions = localStorage.getItem('fit-daily-completions');
    return storedCompletions ? JSON.parse(storedCompletions) : [];
  } catch (error) {
    console.error('Failed to load completions from localStorage:', error);
    return [];
  }
};

// Create a sample workout for new users
export const createSampleWorkout = (): Workout => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name: "Quick Morning Workout",
    exercises: [
      {
        id: generateId(),
        name: "Push-ups",
        type: "reps",
        target: 10,
        sets: 3
      },
      {
        id: generateId(),
        name: "Squats",
        type: "reps",
        target: 15,
        sets: 3
      },
      {
        id: generateId(),
        name: "Plank",
        type: "time",
        target: 30, // seconds
        sets: 3
      }
    ],
    createdAt: now,
    updatedAt: now
  };
};
