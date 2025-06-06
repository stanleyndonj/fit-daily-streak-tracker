import React, { useState } from 'react';
import { useAchievement } from '@/context/AchievementContext';
import { useWorkout } from '@/context/WorkoutContext';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, FileDown } from 'lucide-react';
import { formatDateToYYYYMMDD } from '@/lib/workout-utils';

const ExerciseHistory = () => {
  const { exerciseHistory, exportToCSV } = useAchievement();
  const { workouts } = useWorkout();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Get the dates that have exercise history
  const dates = [...new Set(exerciseHistory.map(history => history.date))];
  
  // Format dates for the calendar
  const formattedDates = dates.map(date => {
    const [year, month, day] = date.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  });
  
  // Filter exercise history by selected date
  const filteredHistory = selectedDate
    ? exerciseHistory.filter(history => history.date === formatDateToYYYYMMDD(selectedDate))
    : [];
  
  // Group by workout
  const historyByWorkout = filteredHistory.reduce((acc, history) => {
    const workout = workouts.find(w => w.id === history.workoutId);
    if (workout) {
      if (!acc[workout.name]) {
        acc[workout.name] = [];
      }
      
      const exercise = workout.exercises.find(e => e.id === history.exerciseId);
      if (exercise) {
        acc[workout.name].push({
          ...history,
          exerciseName: exercise.name,
          exerciseType: exercise.type,
          exerciseTarget: exercise.target,
        });
      }
    }
    return acc;
  }, {} as Record<string, Array<any>>);
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Exercise History</CardTitle>
            <CardDescription>Track your completed exercises over time</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <FileDown className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="flex flex-col items-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiersStyles={{
                  hasExercise: { fontWeight: 'bold', backgroundColor: 'rgba(59, 130, 246, 0.1)' }
                }}
                modifiers={{
                  hasExercise: formattedDates
                }}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Dates with exercise data are highlighted
              </p>
            </div>
          </div>
          
          <div className="col-span-1 lg:col-span-2">
            {selectedDate && (
              <div>
                <h3 className="text-lg font-medium mb-4">
                  {selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
                
                {Object.keys(historyByWorkout).length > 0 ? (
                  <>
                    {Object.entries(historyByWorkout).map(([workoutName, exercises]) => (
                      <div key={workoutName} className="mb-6">
                        <h4 className="text-md font-medium mb-2">{workoutName}</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Exercise</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {exercises.map((exercise) => (
                              <TableRow key={exercise.id}>
                                <TableCell className="font-medium">{exercise.exerciseName}</TableCell>
                                <TableCell>
                                  {exercise.exerciseType === 'reps' && `${exercise.exerciseTarget} reps`}
                                  {exercise.exerciseType === 'time' && `${exercise.exerciseTarget} seconds`}
                                  {exercise.exerciseType === 'distance' && `${exercise.exerciseTarget} meters`}
                                </TableCell>
                                <TableCell>
                                  {exercise.timestamp ? new Date(exercise.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-800/30 dark:text-green-300">
                                    Completed
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No exercises completed on this date
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExerciseHistory;
