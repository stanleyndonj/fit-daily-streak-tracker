
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Volume2, Vibrate, Calendar, Target, Play } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSettings, AVAILABLE_RINGTONES } from '@/context/SettingsContext';
import { useAchievement } from '@/context/AchievementContext';
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { playRingtone, getNotificationSounds, playNotificationSound } from '@/utils/ringtoneService';
import { 
  getCurrentSoundInfo, 
  selectPresetSound, 
  openNativeRingtonePicker, 
  testNotificationSound 
} from '@/utils/soundPickerService';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, setupNotificationPermissions, scheduleReminder } = useSettings();
  const { currentWeeklyGoal, setWeeklyGoalTarget } = useAchievement();

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
  const [weeklyGoalEnabled, setWeeklyGoalEnabled] = useState(settings.weeklyGoalEnabled ?? true);
  const [weeklyGoalTarget, setWeeklyGoalTargetState] = useState(settings.weeklyGoalTarget ?? 4);

  // Get current notification sound info
  const currentSoundInfo = getCurrentSoundInfo();
  const notificationSounds = getNotificationSounds();

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
      weeklyGoalEnabled,
      weeklyGoalTarget,
    });
    
    // Schedule reminder if enabled
    if (reminderEnabled) {
      scheduleReminder();
    }
    
    // Update weekly goal target if enabled
    if (weeklyGoalEnabled && currentWeeklyGoal) {
      setWeeklyGoalTarget(weeklyGoalTarget);
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

  // Handle notification sound selection
  const handleNotificationSoundSelect = (soundId: string) => {
    selectPresetSound(soundId);
    playNotificationSound(soundId);
    toast.success("Notification sound updated");
  };

  // Handle custom ringtone picker
  const handleCustomRingtone = async () => {
    const success = await openNativeRingtonePicker();
    if (success) {
      // Refresh the current sound info display
      window.location.reload();
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
                Notification Sounds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Current notification sound</Label>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">{currentSoundInfo.name}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={testNotificationSound}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Test
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Preset notification sounds</Label>
                <div className="grid gap-2">
                  {notificationSounds.map(sound => (
                    <div key={sound.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{sound.name}</span>
                      <Button 
                        variant={currentSoundInfo.uri === sound.uri ? "default" : "outline"} 
                        size="sm"
                        onClick={() => handleNotificationSoundSelect(sound.id)}
                      >
                        {currentSoundInfo.uri === sound.uri ? "Selected" : "Select"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Custom sounds</Label>
                <Button 
                  variant="outline" 
                  onClick={handleCustomRingtone}
                  className="w-full"
                >
                  Choose from device
                </Button>
                <p className="text-xs text-muted-foreground">
                  Select a custom ringtone from your device's sound library.
                </p>
              </div>
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
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-primary" />
                Weekly Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="weekly-goal-switch">Enable weekly workout goals</Label>
                <Switch 
                  id="weekly-goal-switch" 
                  checked={weeklyGoalEnabled}
                  onCheckedChange={setWeeklyGoalEnabled}
                />
              </div>
              
              {weeklyGoalEnabled && (
                <div className="space-y-4 pt-2">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Target workouts per week: {weeklyGoalTarget}</Label>
                    </div>
                    <Slider
                      value={[weeklyGoalTarget]}
                      min={1}
                      max={7}
                      step={1}
                      onValueChange={(value) => setWeeklyGoalTargetState(value[0])}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Set a realistic goal for how many workouts you want to complete each week.
                  </p>
                </div>
              )}
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
