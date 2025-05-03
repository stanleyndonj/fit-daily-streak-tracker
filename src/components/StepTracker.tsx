
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSettings } from '@/context/SettingsContext';
import { useStepCounter } from '@/hooks/useStepCounter';

const StepTracker: React.FC = () => {
  const { settings } = useSettings();
  const { steps } = useStepCounter();
  
  const goal = settings.dailyStepGoal;
  const progress = Math.min(Math.round((steps / goal) * 100), 100);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Step Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">{steps.toLocaleString()}</span>
            <span className="text-muted-foreground">Goal: {goal.toLocaleString()}</span>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          <div className="text-right text-sm text-muted-foreground">
            {progress}% of daily goal
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StepTracker;
