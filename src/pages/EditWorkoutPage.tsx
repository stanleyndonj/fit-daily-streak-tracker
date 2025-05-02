
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkout } from '@/context/WorkoutContext';
import Header from '@/components/Header';
import WorkoutForm from '@/components/WorkoutForm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const EditWorkoutPage = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const { workouts } = useWorkout();
  const navigate = useNavigate();
  
  const workout = workouts.find(w => w.id === workoutId);
  
  if (!workout) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="flex-1 container max-w-4xl py-12 px-4 flex items-center justify-center">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Workout Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The workout you're looking for does not exist or has been deleted.
            </p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Workouts
            </Button>
          </Card>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="flex-1 container max-w-4xl py-6 px-4">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/workout/${workout.id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to workout details
          </Button>
        </div>
        
        <WorkoutForm 
          mode="edit" 
          workoutId={workout.id}
          initialName={workout.name}
          initialExercises={workout.exercises}
        />
      </main>
    </div>
  );
};

export default EditWorkoutPage;
