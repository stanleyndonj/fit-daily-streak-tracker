
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkout } from '@/context/WorkoutContext';
import Header from '@/components/Header';
import ExerciseList from '@/components/ExerciseList';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Edit, Plus } from 'lucide-react';

const WorkoutDetailPage = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const { workouts } = useWorkout();
  const navigate = useNavigate();
  
  const workout = workouts.find(w => w.id === workoutId);
  
  if (!workout) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="flex-1 container max-w-6xl py-12 px-4 flex items-center justify-center">
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
      <main className="flex-1 container max-w-6xl py-6 px-4">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to workouts
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-3xl font-bold mb-2 sm:mb-0">{workout.name}</h1>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/edit-workout/${workout.id}`)}>
              <Edit className="h-4 w-4 mr-2" /> Edit Workout
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ExerciseList workout={workout} />
          </div>
          
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Workout Details</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Exercises</dt>
                  <dd className="font-medium">{workout.exercises.length}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Created</dt>
                  <dd className="font-medium">
                    {new Date(workout.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkoutDetailPage;
