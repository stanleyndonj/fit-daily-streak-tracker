
import { Exercise, Workout, WorkoutCompletion, StreakData } from "@/types";
import { format, isToday, parseISO, differenceInDays, addDays, startOfDay } from "date-fns";

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
  const completion = completions.find(c => c.date === date);
  return completion ? completion.completedExercises.includes(exerciseId) : false;
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
  localStorage.setItem('fit-daily-workouts', JSON.stringify(workouts));
};

export const saveCompletions = (completions: WorkoutCompletion[]): void => {
  localStorage.setItem('fit-daily-completions', JSON.stringify(completions));
};

// Load data from localStorage
export const loadWorkouts = (): Workout[] => {
  const storedWorkouts = localStorage.getItem('fit-daily-workouts');
  return storedWorkouts ? JSON.parse(storedWorkouts) : [];
};

export const loadCompletions = (): WorkoutCompletion[] => {
  const storedCompletions = localStorage.getItem('fit-daily-completions');
  return storedCompletions ? JSON.parse(storedCompletions) : [];
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
