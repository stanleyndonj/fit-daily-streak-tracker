
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { toast } from "sonner";
import { useWorkout } from '@/context/WorkoutContext';
import { WorkoutCompletion } from '@/types';

interface WorkoutNotesProps {
  workoutId: string;
  date: string;
}

const WorkoutNotes: React.FC<WorkoutNotesProps> = ({ workoutId, date }) => {
  const { completions, updateWorkoutNote } = useWorkout();
  const [isEditing, setIsEditing] = useState(false);
  
  // Find existing completion for this workout and date
  const completion = completions.find(c => c.workoutId === workoutId && c.date === date);
  const existingNote = completion?.notes || '';
  
  const [note, setNote] = useState(existingNote);
  
  const handleSaveNote = () => {
    if (completion) {
      updateWorkoutNote(completion.id, note);
      setIsEditing(false);
      toast.success("Note saved");
    }
  };
  
  const formattedDate = format(new Date(date), 'EEEE, MMM d, yyyy');
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Workout Notes</span>
          <span className="text-sm font-normal text-muted-foreground">{formattedDate}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!completion ? (
          <p className="text-muted-foreground text-sm">
            Complete this workout to add notes.
          </p>
        ) : isEditing ? (
          <>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="How did your workout feel today?"
              className="resize-none h-32"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveNote}>
                Save Note
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="min-h-[60px] text-sm">
              {existingNote ? (
                <p>{existingNote}</p>
              ) : (
                <p className="text-muted-foreground italic">No notes yet. Add how your workout felt.</p>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              {existingNote ? "Edit Note" : "Add Note"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkoutNotes;
