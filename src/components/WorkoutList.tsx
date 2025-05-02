
import React from 'react';
import { useWorkout } from '@/context/WorkoutContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDateToYYYYMMDD, getWorkoutCompletionPercentage } from '@/lib/workout-utils';
import { Dumbbell, Check, Calendar, Plus, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

const WorkoutList: React.FC = () => {
  const { workouts, completions, deleteWorkout } = useWorkout();
  const navigate = useNavigate();
  const today = formatDateToYYYYMMDD(new Date());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Workouts</h2>
        <Button onClick={() => navigate('/create-workout')} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Workout
        </Button>
      </div>

      {workouts.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-muted/20">
          <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium">No workouts yet</h3>
          <p className="text-muted-foreground mb-4">Create your first workout to get started</p>
          <Button onClick={() => navigate('/create-workout')}>
            <Plus className="h-4 w-4 mr-2" /> Create Workout
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workouts.map((workout) => {
            const completionPercentage = getWorkoutCompletionPercentage(workout, completions, today);
            const isCompleted = completionPercentage === 100;
            
            return (
              <Card key={workout.id} className={`workout-card ${isCompleted ? 'workout-completed' : ''}`}>
                {isCompleted && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                    <Check className="h-4 w-4" />
                  </div>
                )}
                
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{workout.name}</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this workout?')) {
                          deleteWorkout(workout.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-2">
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <Dumbbell className="h-4 w-4 mr-2" />
                    <span>{workout.exercises.length} exercises</span>
                  </div>
                  
                  <Progress value={completionPercentage} className="h-2 my-2" />
                  
                  <div className="text-xs text-right text-muted-foreground">
                    {completionPercentage.toFixed(0)}% complete today
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => navigate(`/workout/${workout.id}`)}
                  >
                    {isCompleted ? (
                      <>
                        <Check className="h-4 w-4 mr-2" /> Completed
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4 mr-2" /> View Workout
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WorkoutList;
