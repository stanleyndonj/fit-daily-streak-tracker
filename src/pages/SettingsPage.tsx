
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Volume2, Vibrate, Calendar } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSettings, AVAILABLE_RINGTONES } from '@/context/SettingsContext';
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { playRingtone } from './ringtoneService';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, setupNotificationPermissions, scheduleReminder } = useSettings();

  const [reminderEnabled, setReminderEnabled] = useState(settings.reminderEnabled);
  const [reminderTime, setReminderTime] = useState(settings.reminderTime || "07:00");
  const [reminderDate, setReminderDate] = useState<Date | undefined>(
    settings.reminderDate ? new Date(settings.reminderDate) : undefined
  );
  const [weekdaysOnly, setWeekdaysOnly] = useState(settings.weekdaysOnly || false);
  const [voiceCuesEnabled, setVoiceCuesEnabled] = useState(settings.voiceCuesEnabled);
  const [vibrationEnabled, setVibrationEnabled] = useState(settings.vibrationEnabled);
  const [dailyStepGoal, setDailyStepGoal] = useState(settings.dailyStepGoal);
  const [selectedRingtone, setSelectedRingtone] = useState(settings.selectedRingtone || 'default');
  const [notifyInBackground, setNotifyInBackground] = useState(settings.notifyInBackground ?? true);

  // Save settings when they change
  const saveSettings = () => {
    updateSettings({
      reminderEnabled,
      reminderTime,
      reminderDate: reminderDate ? reminderDate.toISOString() : undefined,
      weekdaysOnly,
      voiceCuesEnabled,
      vibrationEnabled,
      dailyStepGoal: Number(dailyStepGoal) || 5000,
      selectedRingtone,
      notifyInBackground,
    });
    
    // Schedule reminder if enabled
    if (reminderEnabled) {
      scheduleReminder();
    }

    toast.success("Settings saved successfully");
  };

  // Handle reminder change
  const handleReminderChange = async (checked: boolean) => {
    setReminderEnabled(checked);
    if (checked) {
      // Request notification permissions
      const granted = await setupNotificationPermissions();
      if (granted) {
        toast.success("Daily reminder notifications enabled");
      } else {
        toast.error("Please allow notifications in your device settings");
        setReminderEnabled(false);
      }
    }
  };

  // Handle ringtone selection and preview
  const handleRingtoneSelect = (value: string) => {
    setSelectedRingtone(value);
    // Play a preview of the selected ringtone
    playRingtone(value);
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
                <>
                  <div className="mt-4">
                    <Label htmlFor="reminder-time">Reminder time</Label>
                    <Input 
                      id="reminder-time" 
                      type="time" 
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="mt-4">
                    <Label htmlFor="reminder-date" className="block mb-2">Reminder date (optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="reminder-date"
                          variant={"outline"}
                          className={`w-full justify-start text-left font-normal ${!reminderDate && "text-muted-foreground"}`}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {reminderDate ? format(reminderDate, "PPP") : "Pick a specific date (optional)"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={reminderDate}
                          onSelect={setReminderDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="mt-2 flex items-start space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setReminderDate(undefined)}
                        disabled={!reminderDate}
                      >
                        Clear date
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        If no date is selected, reminder will be scheduled daily.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mt-4">
                    <Checkbox 
                      id="weekdays-only" 
                      checked={weekdaysOnly}
                      onCheckedChange={(checked) => setWeekdaysOnly(checked === true)}
                    />
                    <label
                      htmlFor="weekdays-only"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Weekdays only (Monday-Friday)
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <Label htmlFor="background-notify">Notify even when app is closed</Label>
                    <Switch 
                      id="background-notify" 
                      checked={notifyInBackground}
                      onCheckedChange={setNotifyInBackground}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enable to receive notifications even when the app is not open. 
                    This may require additional permissions on some devices.
                  </p>

                  <div className="mt-4">
                    <Label htmlFor="ringtone-select">Ringtone</Label>
                    <Select value={selectedRingtone} onValueChange={handleRingtoneSelect}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a ringtone" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_RINGTONES.map(ringtone => (
                          <SelectItem key={ringtone.id} value={ringtone.id}>
                            {ringtone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select a ringtone and hear a preview.
                    </p>
                  </div>
                </>
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
