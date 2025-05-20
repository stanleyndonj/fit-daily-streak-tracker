
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkout } from '@/context/WorkoutContext';
import { Workout, Exercise } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDateToYYYYMMDD, isExerciseCompleted } from '@/lib/workout-utils';
import { Clock, Dumbbell, Ruler, PenLine } from 'lucide-react';

interface ExerciseListProps {
  workout: Workout;
}

const ExerciseList: React.FC<ExerciseListProps> = ({ workout }) => {
  const { completions, toggleExerciseCompletion } = useWorkout();
  const navigate = useNavigate();
  const today = formatDateToYYYYMMDD(new Date());
  
  useEffect(() => {
    // Debug log to help troubleshoot exercise display issues
    console.log("Workout in ExerciseList:", workout);
    console.log("Exercises:", workout?.exercises);
  }, [workout]);

  // Helper function to display exercise details based on type
  const renderExerciseDetails = (exercise: Exercise) => {
    switch (exercise.type) {
      case 'reps':
        return (
          <div className="flex items-center text-sm text-muted-foreground">
            <Dumbbell className="h-4 w-4 mr-1" />
            <span>
              {exercise.sets ? `${exercise.sets} sets × ` : ''}
              {exercise.target} reps
            </span>
          </div>
        );
      case 'time':
        return (
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            <span>
              {exercise.sets ? `${exercise.sets} sets × ` : ''}
              {exercise.target} seconds
            </span>
          </div>
        );
      case 'distance':
        return (
          <div className="flex items-center text-sm text-muted-foreground">
            <Ruler className="h-4 w-4 mr-1" />
            <span>
              {exercise.sets ? `${exercise.sets} sets × ` : ''}
              {exercise.target} meters
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  // Enhanced handler with proper validation and error handling
  const handleToggleExercise = (workoutId: string, exerciseId: string, exerciseName: string) => {
    // Extensive validation to catch any issues
    if (!workoutId) {
      console.error("Missing workout ID in toggle handler");
      return;
    }
    
    if (!exerciseId) {
      console.error(`Missing exercise ID for ${exerciseName || 'unknown exercise'} in workout: ${workoutId}`);
      return;
    }
    
    console.log(`Toggling exercise: ${exerciseName} (ID: ${exerciseId}) in workout: ${workoutId}`);
    toggleExerciseCompletion(workoutId, exerciseId);
  };

  return (
    <Card>
      <CardHeader className="flex justify-between items-center pb-2">
        <CardTitle className="text-lg">Today's Exercises</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(`/edit-workout/${workout.id}`)}
        >
          <PenLine className="h-4 w-4 mr-2" /> Edit
        </Button>
      </CardHeader>
      <CardContent>
        {!workout?.exercises || workout.exercises.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No exercises in this workout yet</p>
            <Button 
              className="mt-2" 
              size="sm" 
              onClick={() => navigate(`/edit-workout/${workout.id}`)}
            >
              Add Exercise
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {workout.exercises.map((exercise) => {
              // Ensure exercise has a valid ID before trying to check completion status
              if (!exercise || !exercise.id) {
                console.error(`Exercise missing ID: ${exercise?.name || 'unknown'}`);
                return null;
              }
              
              const isCompleted = isExerciseCompleted(exercise.id, completions, today);
              
              return (
                <div key={exercise.id} className="exercise-item py-3">
                  <div className="flex items-center">
                    <Checkbox 
                      id={`exercise-${exercise.id}`}
                      checked={isCompleted}
                      onCheckedChange={() => handleToggleExercise(workout.id, exercise.id, exercise.name)}
                      className="mr-3"
                    />
                    <div>
                      <div className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        {exercise.name}
                      </div>
                      {renderExerciseDetails(exercise)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExerciseList;
