
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
  timestamp?: string; // When the workout was completed
}

// New interface for tracking individual exercise completions with timestamps
export interface ExerciseCompletion {
  id: string;
  exerciseId: string;
  workoutId: string;
  date: string;
  timestamp: string;
  sets?: number;
  reps?: number;
  time?: number;
  distance?: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: string | null;
  streakDates: string[];
}

// Weekly goal interface
export interface WeeklyGoal {
  id: string;
  targetWorkouts: number;
  startDate: string; // Start of the week
  endDate: string;   // End of the week
  completedWorkouts: number;
  isAchieved: boolean;
}

// Badge/achievement interface
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedDate?: string;
  unlocked: boolean;
  type: 'streak' | 'exercise' | 'time' | 'custom';
  requirement: number; // E.g., 5 for 5-day streak, 10 for 10 unique exercises
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
  weeklyGoalEnabled?: boolean; // New setting for weekly goals
  weeklyGoalTarget?: number;   // Target number of workouts per week
}
