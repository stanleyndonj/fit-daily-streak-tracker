
import React from 'react';
import { useWorkout } from '@/context/WorkoutContext';
import { Workout, Exercise } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDateToYYYYMMDD, isExerciseCompleted } from '@/lib/workout-utils';
import { Clock, Dumbbell, Ruler } from 'lucide-react';

interface ExerciseListProps {
  workout: Workout;
}

const ExerciseList: React.FC<ExerciseListProps> = ({ workout }) => {
  const { completions, toggleExerciseCompletion } = useWorkout();
  const today = formatDateToYYYYMMDD(new Date());

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
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Today's Exercises</CardTitle>
      </CardHeader>
      <CardContent>
        {workout.exercises.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No exercises in this workout yet</p>
            <Button className="mt-2" size="sm">Add Exercise</Button>
          </div>
        ) : (
          <div className="divide-y">
            {workout.exercises.map((exercise) => {
              const completed = isExerciseCompleted(exercise.id, completions, today);
              
              return (
                <div key={exercise.id} className="exercise-item py-3">
                  <div className="flex items-center">
                    <Checkbox 
                      id={`exercise-${exercise.id}`}
                      checked={completed}
                      onCheckedChange={() => toggleExerciseCompletion(workout.id, exercise.id)}
                      className="mr-3"
                    />
                    <div>
                      <div className={`font-medium ${completed ? 'line-through text-muted-foreground' : ''}`}>
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
