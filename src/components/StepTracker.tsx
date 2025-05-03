
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSettings } from '@/context/SettingsContext';
import { useStepCounter } from '@/hooks/useStepCounter';
import { Footprints } from 'lucide-react';

const StepTracker: React.FC = () => {
  const { settings } = useSettings();
  const { steps } = useStepCounter();
  
  const goal = settings.dailyStepGoal;
  const progress = Math.min(Math.round((steps / goal) * 100), 100);
  
  return (
    <Card className="dashboard-card glass-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Footprints className="h-5 w-5 mr-2 text-primary" />
            Step Tracker
          </CardTitle>
          <span className="text-sm text-muted-foreground rounded-full bg-muted px-2.5 py-0.5">
            {progress}%
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold stat-value">{steps.toLocaleString()}</span>
            <span className="text-muted-foreground text-sm">Goal: {goal.toLocaleString()}</span>
          </div>
          
          <div className="relative pt-1">
            <Progress 
              value={progress} 
              className="h-2.5 overflow-hidden rounded-full bg-secondary/20" 
            />
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">0</span>
            <div className="flex-1 border-t border-dashed border-muted-foreground/30 mx-2"></div>
            <span className="text-muted-foreground">{goal.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StepTracker;
