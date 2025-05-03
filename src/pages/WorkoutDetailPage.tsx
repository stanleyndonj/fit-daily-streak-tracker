
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkout } from '@/context/WorkoutContext';
import { useSettings } from '@/context/SettingsContext';
import Header from '@/components/Header';
import ExerciseList from '@/components/ExerciseList';
import WorkoutNotes from '@/components/WorkoutNotes';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Edit, Volume2, Vibrate } from 'lucide-react';
import { formatDateToYYYYMMDD } from '@/lib/workout-utils';

const WorkoutDetailPage = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const { workouts } = useWorkout();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const today = formatDateToYYYYMMDD(new Date());
  
  const workout = workouts.find(w => w.id === workoutId);
  
  // For vibration and voice feedback in a real app
  // Here we just show status
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVibrating, setIsVibrating] = useState(false);
  
  useEffect(() => {
    // In a real mobile app with Capacitor, we would implement
    // actual text-to-speech and vibration here
    let speechInterval: ReturnType<typeof setInterval>;
    let vibrationInterval: ReturnType<typeof setInterval>;
    
    if (settings.voiceCuesEnabled) {
      speechInterval = setInterval(() => {
        setIsSpeaking(prev => !prev);
      }, 3000);
    }
    
    if (settings.vibrationEnabled) {
      vibrationInterval = setInterval(() => {
        setIsVibrating(prev => !prev);
      }, 5000);
    }
    
    return () => {
      if (speechInterval) clearInterval(speechInterval);
      if (vibrationInterval) clearInterval(vibrationInterval);
    };
  }, [settings.voiceCuesEnabled, settings.vibrationEnabled]);
  
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
            {settings.voiceCuesEnabled && (
              <div className={`px-2 py-1 text-xs rounded-full flex items-center ${isSpeaking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                <Volume2 className="h-3 w-3 mr-1" />
                Voice
              </div>
            )}
            {settings.vibrationEnabled && (
              <div className={`px-2 py-1 text-xs rounded-full flex items-center ${isVibrating ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
                <Vibrate className="h-3 w-3 mr-1" />
                Vibration
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate(`/edit-workout/${workout.id}`)}>
              <Edit className="h-4 w-4 mr-2" /> Edit Workout
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ExerciseList workout={workout} />
            <div className="mt-6">
              <WorkoutNotes workoutId={workout.id} date={today} />
            </div>
          </div>
          
          <div className="lg:col-span-1 space-y-6">
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
