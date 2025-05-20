
import React, { useState } from 'react';
import { useWorkout } from '@/context/WorkoutContext';
import { Exercise } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { X, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateId } from '@/lib/workout-utils';

interface WorkoutFormProps {
  mode: 'create' | 'edit';
  initialName?: string;
  initialExercises?: Exercise[];
  workoutId?: string;
}

const WorkoutForm: React.FC<WorkoutFormProps> = ({ 
  mode, 
  initialName = '', 
  initialExercises = [], 
  workoutId 
}) => {
  const { addWorkout, updateWorkout, workouts } = useWorkout();
  const navigate = useNavigate();
  
  const [name, setName] = useState(initialName);
  const [exercises, setExercises] = useState<Array<Exercise | Partial<Exercise>>>(initialExercises);
  const [error, setError] = useState('');
  
  const handleAddExercise = () => {
    setExercises([...exercises, { 
      id: generateId(), // Add a unique ID for each new exercise
      name: '', 
      type: 'reps', 
      target: 10, 
      sets: 3 
    }]);
  };
  
  const handleRemoveExercise = (index: number) => {
    const newExercises = [...exercises];
    newExercises.splice(index, 1);
    setExercises(newExercises);
  };
  
  const handleExerciseChange = (index: number, field: string, value: string | number) => {
    const newExercises = [...exercises];
    newExercises[index] = {
      ...newExercises[index],
      [field]: value
    };
    setExercises(newExercises);
  };
  
  const handleSubmit = () => {
    // Validate form
    if (!name.trim()) {
      setError('Workout name is required');
      return;
    }
    
    if (exercises.length === 0) {
      setError('At least one exercise is required');
      return;
    }
    
    // Check if all exercises have names and IDs
    const invalidExercise = exercises.findIndex(ex => !ex.name?.trim());
    if (invalidExercise !== -1) {
      setError(`Exercise #${invalidExercise + 1} needs a name`);
      return;
    }
    
    // Ensure all exercises have IDs
    const exercisesWithIds = exercises.map(ex => {
      if (!ex.id) {
        return { ...ex, id: generateId() };
      }
      return ex;
    });
    
    setError('');
    
    if (mode === 'create') {
      // Use the exercises with guaranteed IDs
      addWorkout({ 
        name,
        exercises: exercisesWithIds as Exercise[]
      });
      navigate('/');
    } else if (mode === 'edit' && workoutId) {
      const workout = workouts.find(w => w.id === workoutId);
      if (workout) {
        updateWorkout({
          ...workout,
          name,
          exercises: exercisesWithIds as Exercise[]
        });
        navigate(`/workout/${workoutId}`);
      }
    }
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create New Workout' : 'Edit Workout'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="workout-name">Workout Name</Label>
            <Input
              id="workout-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Morning Routine, Leg Day, etc."
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Exercises</Label>
              <Button variant="outline" size="sm" onClick={handleAddExercise}>
                <Plus className="h-4 w-4 mr-1" /> Add Exercise
              </Button>
            </div>
            
            {exercises.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground mb-2">No exercises added yet</p>
                <Button onClick={handleAddExercise} size="sm">Add Your First Exercise</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {exercises.map((exercise, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end border p-3 rounded-lg">
                    <div className="col-span-12 sm:col-span-4">
                      <Label htmlFor={`exercise-name-${index}`} className="text-xs mb-1 block">
                        Exercise Name
                      </Label>
                      <Input
                        id={`exercise-name-${index}`}
                        value={exercise.name || ''}
                        onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                        placeholder="Push-ups, Squats, etc."
                      />
                    </div>
                    
                    <div className="col-span-4 sm:col-span-2">
                      <Label htmlFor={`exercise-type-${index}`} className="text-xs mb-1 block">
                        Type
                      </Label>
                      <Select
                        value={exercise.type || 'reps'}
                        onValueChange={(value) => handleExerciseChange(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reps">Reps</SelectItem>
                          <SelectItem value="time">Time</SelectItem>
                          <SelectItem value="distance">Distance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="col-span-4 sm:col-span-2">
                      <Label htmlFor={`exercise-target-${index}`} className="text-xs mb-1 block">
                        {exercise.type === 'reps' ? 'Repetitions' : 
                          exercise.type === 'time' ? 'Seconds' : 'Meters'}
                      </Label>
                      <Input
                        id={`exercise-target-${index}`}
                        type="number"
                        min={1}
                        value={exercise.target || ''}
                        onChange={(e) => handleExerciseChange(index, 'target', 
                          e.target.value ? parseInt(e.target.value) : '')}
                      />
                    </div>
                    
                    <div className="col-span-3 sm:col-span-2">
                      <Label htmlFor={`exercise-sets-${index}`} className="text-xs mb-1 block">
                        Sets
                      </Label>
                      <Input
                        id={`exercise-sets-${index}`}
                        type="number"
                        min={1}
                        value={exercise.sets || ''}
                        onChange={(e) => handleExerciseChange(index, 'sets', 
                          e.target.value ? parseInt(e.target.value) : '')}
                      />
                    </div>
                    
                    <div className="col-span-1 sm:col-span-2 flex justify-end">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleRemoveExercise(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => navigate(workoutId ? `/workout/${workoutId}` : '/')}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          {mode === 'create' ? 'Create Workout' : 'Save Changes'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WorkoutForm;
