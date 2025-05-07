
// Types for the fitness app

export interface Exercise {
  id: string;
  name: string;
  type: 'reps' | 'time' | 'distance';
  target: number; // Number of reps, seconds, or meters
  sets?: number;
}

export interface Workout {
  id: string;
  name: string;
  exercises: Exercise[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutCompletion {
  id: string;
  workoutId: string;
  date: string; // YYYY-MM-DD format
  completedExercises: string[]; // Array of exercise IDs
  notes?: string; // Added for journal/notes feature
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: string | null; // YYYY-MM-DD format
  streakDates: string[]; // Array of dates in YYYY-MM-DD format
}

// Settings types
export interface AppSettings {
  reminderEnabled: boolean;
  reminderTime: string;
  voiceCuesEnabled: boolean;
  vibrationEnabled: boolean;
  dailyStepGoal: number;
  selectedRingtone?: string;
  notificationPriority?: string;
}

export interface StepData {
  date: string; // YYYY-MM-DD format
  count: number;
  baselineCount: number; // The count at the start of the day
}
