
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSettings } from '@/context/SettingsContext';
import { useStepCounter } from '@/hooks/useStepCounter';
import { Footprints, Edit, Check, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import { useWorkout } from '@/context/WorkoutContext';
import { formatDateToYYYYMMDD } from '@/lib/workout-utils';

const STEPS_WORKOUT_ID = 'daily-steps-workout';
const STEPS_EXERCISE_ID = 'daily-steps-exercise';

const StepTracker: React.FC = () => {
  const { settings } = useSettings();
  const { steps, setManualSteps } = useStepCounter();
  const [isEditing, setIsEditing] = useState(false);
  const [manualSteps, setManualStepsInput] = useState('');
  const { workouts, completions, toggleExerciseCompletion } = useWorkout();
  const [goalAchieved, setGoalAchieved] = useState(false);
  
  const goal = settings.dailyStepGoal;
  const progress = Math.min(Math.round((steps / goal) * 100), 100);
  const today = formatDateToYYYYMMDD(new Date());
  
  // Check if goal is achieved
  useEffect(() => {
    if (steps >= goal) {
      setGoalAchieved(true);
      
      // Check if we already have a completion record for steps today
      const today = formatDateToYYYYMMDD(new Date());
      const existingCompletion = completions.find(
        c => c.workoutId === STEPS_WORKOUT_ID && c.date === today && 
        c.completedExercises.includes(STEPS_EXERCISE_ID)
      );
      
      // Only mark as completed if it's not already
      if (!existingCompletion) {
        console.log('Step goal achieved! Marking as completed exercise.');
        toggleExerciseCompletion(STEPS_WORKOUT_ID, STEPS_EXERCISE_ID);
      }
    } else {
      setGoalAchieved(false);
    }
  }, [steps, goal, completions, toggleExerciseCompletion]);
  
  const handleSaveManualSteps = () => {
    const stepsCount = parseInt(manualSteps);
    if (!isNaN(stepsCount) && stepsCount >= 0) {
      setManualSteps(stepsCount);
      setIsEditing(false);
      setManualStepsInput('');
      toast.success("Steps updated successfully");
    } else {
      toast.error("Please enter a valid number of steps");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveManualSteps();
    }
  };
  
  return (
    <Card className="dashboard-card glass-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Footprints className="h-5 w-5 mr-2 text-primary" />
            Step Tracker
          </CardTitle>
          <span className="text-sm text-muted-foreground rounded-full bg-muted px-2.5 py-0.5">
            {progress}%
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            {isEditing ? (
              <div className="flex w-full gap-2">
                <Input 
                  type="number" 
                  placeholder="Enter steps" 
                  value={manualSteps} 
                  onChange={(e) => setManualStepsInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full"
                  autoFocus
                />
                <Button size="icon" onClick={handleSaveManualSteps}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <span className="text-3xl font-bold stat-value">{steps.toLocaleString()}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 text-xs"
                >
                  <Edit className="h-3 w-3" />
                  Manual
                </Button>
              </>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Goal: {goal.toLocaleString()}</span>
            <span className="text-muted-foreground text-sm">
              {goalAchieved ? (
                <span className="flex items-center text-green-500">
                  <Trophy className="h-3.5 w-3.5 mr-1" />
                  Goal reached!
                </span>
              ) : (
                `${goal - steps} steps to go`
              )}
            </span>
          </div>
          
          <div className="relative pt-1">
            <Progress 
              value={progress} 
              className={`h-2.5 overflow-hidden rounded-full bg-secondary/20 ${goalAchieved ? 'bg-green-100' : ''}`} 
            />
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">0</span>
            <div className="flex-1 border-t border-dashed border-muted-foreground/30 mx-2"></div>
            <span className="text-muted-foreground">{goal.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StepTracker;
