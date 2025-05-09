
export interface Exercise {
  id: string;
  name: string;
  type: 'reps' | 'time' | 'distance';
  target: number;
  sets: number;
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
  date: string;
  completedExercises: string[];
  notes?: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: string | null;
  streakDates: string[];
}

export interface AppSettings {
  reminderEnabled: boolean;
  reminderTime: string;
  reminderDate?: string;
  weekdaysOnly: boolean;
  voiceCuesEnabled: boolean;
  vibrationEnabled: boolean;
  dailyStepGoal: number;
  selectedRingtone: string;
  notificationPriority: string;
  notifyInBackground: boolean; // Added for background notifications
}
