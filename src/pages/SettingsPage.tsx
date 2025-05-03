
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Volume2, Vibrate } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSettings } from '@/context/SettingsContext';
import { toast } from "sonner";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  
  const [reminderEnabled, setReminderEnabled] = useState(settings.reminderEnabled);
  const [reminderTime, setReminderTime] = useState(settings.reminderTime || "07:00");
  const [voiceCuesEnabled, setVoiceCuesEnabled] = useState(settings.voiceCuesEnabled);
  const [vibrationEnabled, setVibrationEnabled] = useState(settings.vibrationEnabled);
  const [dailyStepGoal, setDailyStepGoal] = useState(settings.dailyStepGoal);
  
  // Save settings when they change
  const saveSettings = () => {
    updateSettings({
      reminderEnabled,
      reminderTime,
      voiceCuesEnabled,
      vibrationEnabled,
      dailyStepGoal: Number(dailyStepGoal) || 5000,
    });
    
    toast.success("Settings saved successfully");
  };

  // Handle reminder change
  const handleReminderChange = (checked: boolean) => {
    setReminderEnabled(checked);
    if (checked) {
      // In a real mobile app, this would request notification permissions
      toast.info("Daily reminder notifications enabled");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="flex-1 container max-w-4xl py-6 px-4">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to workouts
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2 text-primary" />
                Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="reminder-switch">Daily workout reminder</Label>
                <Switch 
                  id="reminder-switch" 
                  checked={reminderEnabled}
                  onCheckedChange={handleReminderChange}
                />
              </div>
              
              {reminderEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="reminder-time">Reminder time</Label>
                  <Input 
                    id="reminder-time" 
                    type="time" 
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    You will receive a daily notification at this time.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Volume2 className="h-5 w-5 mr-2 text-primary" />
                Workout Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="voice-switch">Voice cues during workout</Label>
                <Switch 
                  id="voice-switch" 
                  checked={voiceCuesEnabled}
                  onCheckedChange={setVoiceCuesEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="vibration-switch">Vibration feedback</Label>
                <Switch 
                  id="vibration-switch" 
                  checked={vibrationEnabled}
                  onCheckedChange={setVibrationEnabled}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Step Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="step-goal">Daily step goal</Label>
                <Input 
                  id="step-goal" 
                  type="number" 
                  value={dailyStepGoal}
                  onChange={(e) => setDailyStepGoal(parseInt(e.target.value) || 5000)}
                  min={1000}
                  max={50000}
                  step={1000}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Set your daily step count target
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={saveSettings}>Save Settings</Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
