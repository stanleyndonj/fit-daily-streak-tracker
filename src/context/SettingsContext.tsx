
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings } from '@/types';
import { Capacitor } from '@capacitor/core';
import { format, isWeekend } from 'date-fns';
import { toast } from "sonner";

// Define interfaces for type safety when using dynamic imports
interface LocalNotificationsPlugin {
  checkPermissions: () => Promise<{ display: string }>;
  requestPermissions: () => Promise<{ display: string }>;
  cancel: (options: any) => Promise<void>;
  schedule: (options: any) => Promise<any>;
  createChannel: (options: any) => Promise<void>;
  registerActionTypes: (options: any) => Promise<void>;
}

interface HapticsPlugin {
  vibrate: () => Promise<void>;
}

interface AppPlugin {
  addListener: (eventName: string, callback: any) => Promise<any>;
  exitApp: () => Promise<void>;
}

// Import Capacitor plugins conditionally
let LocalNotifications: LocalNotificationsPlugin | undefined = undefined;
let Haptics: HapticsPlugin | undefined = undefined;
let App: AppPlugin | undefined = undefined;

// Dynamically import Capacitor plugins
const importCapacitorPlugins = async () => {
  if (Capacitor.isNativePlatform()) {
    if (Capacitor.isPluginAvailable('LocalNotifications')) {
      try {
        const module = await import('@capacitor/local-notifications' /* webpackIgnore: true */);
        LocalNotifications = module.LocalNotifications;
      } catch (error) {
        console.error('Error importing LocalNotifications:', error);
      }
    }
    if (Capacitor.isPluginAvailable('Haptics')) {
      try {
        const module = await import('@capacitor/haptics' /* webpackIgnore: true */);
        Haptics = module.Haptics;
      } catch (error) {
        console.error('Error importing Haptics:', error);
      }
    }
    if (Capacitor.isPluginAvailable('App')) {
      try {
        const module = await import('@capacitor/app' /* webpackIgnore: true */);
        App = module.App;
      } catch (error) {
        console.error('Error importing App:', error);
      }
    }
  }
};

// Available ringtones for Android
export const AVAILABLE_RINGTONES = [
  { id: "default", name: "Default" },
  { id: "alarm", name: "Alarm" },
  { id: "notification", name: "Notification" },
  { id: "ringtone", name: "Ringtone" },
  { id: "beep", name: "Beep" }
];

// Default settings
const defaultSettings: AppSettings = {
  reminderEnabled: false,
  reminderTime: "07:00",
  reminderDate: undefined,
  weekdaysOnly: false,
  voiceCuesEnabled: false,
  vibrationEnabled: true,
  dailyStepGoal: 5000,
  selectedRingtone: "default",
  notificationPriority: "high",
  notifyInBackground: true
};

// Context type definition
interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  setupNotificationPermissions: () => Promise<boolean>;
  scheduleReminder: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [pluginsLoaded, setPluginsLoaded] = useState(false);

  // Load Capacitor plugins on component mount if on native platform
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      importCapacitorPlugins().then(() => {
        setPluginsLoaded(true);
        initializeNotifications();
      });
    } else {
      setPluginsLoaded(true);
    }
  }, []);

  // Setup notification listeners
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !LocalNotifications) return;
    
    // Register action types
    const setupNotificationActions = async () => {
      try {
        await LocalNotifications.registerActionTypes({
          types: [
            {
              id: 'WORKOUT_ACTIONS',
              actions: [
                {
                  id: 'open',
                  title: 'Open App'
                },
                {
                  id: 'snooze',
                  title: 'Snooze (10 min)'
                }
              ]
            }
          ]
        });
      } catch (error) {
        console.error('Error setting up notification actions:', error);
      }
    };
    
    setupNotificationActions();
    
    // Create notification channel for Android
    if (Capacitor.getPlatform() === 'android') {
      createNotificationChannel();
    }
    
    return () => {
      // Cleanup can be added here if needed
    };
  }, [pluginsLoaded]);

  // Initialize notifications
  const initializeNotifications = async () => {
    if (!Capacitor.isNativePlatform() || !LocalNotifications) return;
    
    try {
      const { display } = await LocalNotifications.checkPermissions();
      
      if (display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };
  
  // Create a notification channel for Android
  const createNotificationChannel = async () => {
    if (!LocalNotifications) return;
    
    try {
      await LocalNotifications.createChannel({
        id: "workout-reminders",
        name: "Workout Reminders",
        description: "Notification channel for workout reminders",
        importance: 4,
        visibility: 1,
        sound: settings.selectedRingtone,
        vibration: settings.vibrationEnabled,
        lights: true,
        lightColor: "#488AFF"
      });
    } catch (error) {
      console.error('Error creating notification channel:', error);
    }
  };

  // Load settings from localStorage on component mount
  useEffect(() => {
    const storedSettings = localStorage.getItem('fit-daily-settings');
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
  }, []);

  // Setup schedule when settings or plugins change
  useEffect(() => {
    if (pluginsLoaded && settings.reminderEnabled) {
      scheduleReminder();
    }
  }, [
    pluginsLoaded, 
    settings.reminderEnabled, 
    settings.reminderTime, 
    settings.reminderDate,
    settings.weekdaysOnly,
    settings.notifyInBackground
  ]);

  // Update settings and save to localStorage
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('fit-daily-settings', JSON.stringify(updatedSettings));
  };

  // Request notification permissions
  const setupNotificationPermissions = async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform() || !LocalNotifications) {
      console.log('Not on a native platform or LocalNotifications not available, simulating successful permission');
      return true;
    }

    try {
      const { display } = await LocalNotifications.requestPermissions();
      return display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  };

  // Schedule workout reminder with improved reliability
  const scheduleReminder = async (): Promise<void> => {
    if (!settings.reminderEnabled || !Capacitor.isNativePlatform() || !LocalNotifications) return;
    
    try {
      // First clear any existing reminders
      await LocalNotifications.cancel({ notifications: [{ id: 100 }] });
      
      // Parse reminder time
      const [hours, minutes] = settings.reminderTime.split(':').map(Number);
      
      // Set up the trigger time based on user's preferences
      const now = new Date();
      let triggerTime: Date;
      
      if (settings.reminderDate) {
        // Use specific date if provided
        triggerTime = new Date(settings.reminderDate);
        triggerTime.setHours(hours, minutes, 0);
        
        // If the date has already passed, don't schedule
        if (triggerTime < now) {
          toast.error("The selected date has already passed. Please select a future date.");
          return;
        }
      } else {
        // Use today/tomorrow for daily reminders
        triggerTime = new Date();
        triggerTime.setHours(hours, minutes, 0);
        
        // If the time has passed today, schedule for tomorrow
        if (triggerTime <= now) {
          triggerTime.setDate(triggerTime.getDate() + 1);
        }
        
        // If weekdaysOnly is enabled and the triggerTime falls on a weekend, move to Monday
        if (settings.weekdaysOnly && isWeekend(triggerTime)) {
          // Move to next Monday
          const dayOfWeek = triggerTime.getDay(); // 0 for Sunday, 6 for Saturday
          const daysToAdd = dayOfWeek === 0 ? 1 : 2; // Add 1 day for Sunday, 2 days for Saturday
          triggerTime.setDate(triggerTime.getDate() + daysToAdd);
        }
      }
      
      // Samsung devices sometimes need extra parameters for reliable notifications
      let soundName = settings.selectedRingtone;
      if (soundName === 'default') {
        soundName = 'notification';  // Fallback to standard notification sound
      }
      
      // Determine if this is a repeating notification
      const isRepeating = !settings.reminderDate;
      const scheduleOptions: any = {
        at: triggerTime,
        every: isRepeating ? 'day' : undefined,
        repeats: isRepeating,
        allowWhileIdle: true,  // Allow notification even when device is idle
        foreground: true  // Show notification even when app is in foreground
      };
      
      // Special handling for exact scheduling on Android
      if (Capacitor.getPlatform() === 'android') {
        scheduleOptions.schedule = {
          exact: true,
          wakeup: true,
          allowInForeground: true
        };
      }
      
      // Schedule notification
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 100,
            title: "Workout Reminder",
            body: "It's time for your workout! Stay on track with your fitness goals.",
            schedule: scheduleOptions,
            sound: soundName,
            ongoing: false,
            autoCancel: true,
            channelId: "workout-reminders",
            smallIcon: "ic_stat_notification",
            largeIcon: "ic_stat_notification",
            importance: 4,  // HIGH priority (Samsung needs higher priority)
            vibration: settings.vibrationEnabled,
            actionTypeId: "WORKOUT_ACTIONS",
            extra: {
              channelName: "Workout Reminders",
              priority: settings.notificationPriority,
              weekdaysOnly: settings.weekdaysOnly,
              exactAlarm: true,
              notifyInBackground: settings.notifyInBackground
            }
          }
        ]
      });
      
      // Trigger haptic feedback to confirm reminder set
      if (settings.vibrationEnabled && Haptics) {
        await Haptics.vibrate();
      }
      
      const formattedDate = format(triggerTime, "PPP 'at' p");
      const repeatInfo = isRepeating ? 
        (settings.weekdaysOnly ? " (repeats on weekdays only)" : " (repeats daily)") : 
        " (one-time)";
        
      toast.success(`Reminder scheduled for ${formattedDate}${repeatInfo}`);
      console.log('Reminder scheduled for', triggerTime, 'with sound', soundName);
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      toast.error("Failed to schedule reminder. Please try again.");
    }
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      setupNotificationPermissions,
      scheduleReminder
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
