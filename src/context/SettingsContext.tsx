import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings } from '@/types';
import { Capacitor } from '@capacitor/core';

// Define interfaces for type safety when using dynamic imports
interface LocalNotificationsPlugin {
  checkPermissions: () => Promise<{ display: string }>;
  requestPermissions: () => Promise<{ display: string }>;
  cancel: (options: any) => Promise<void>;
  schedule: (options: any) => Promise<any>; // Updated to accept any return type
  createChannel: (options: any) => Promise<void>;
}

interface HapticsPlugin {
  vibrate: () => Promise<void>;
}

// Import Capacitor plugins conditionally
let LocalNotifications: LocalNotificationsPlugin | undefined = undefined;
let Haptics: HapticsPlugin | undefined = undefined;

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
  voiceCuesEnabled: false,
  vibrationEnabled: true,
  dailyStepGoal: 5000,
  selectedRingtone: "default",
  notificationPriority: "high"
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
  }, [pluginsLoaded, settings.reminderEnabled, settings.reminderTime]);

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

  // Schedule daily reminder with improved reliability for Samsung devices
  const scheduleReminder = async (): Promise<void> => {
    if (!settings.reminderEnabled || !Capacitor.isNativePlatform() || !LocalNotifications) return;
    
    try {
      // First clear any existing reminders
      await LocalNotifications.cancel({ notifications: [{ id: 100 }] });
      
      // Parse reminder time
      const [hours, minutes] = settings.reminderTime.split(':').map(Number);
      
      // Set up the trigger time
      const now = new Date();
      const triggerTime = new Date();
      triggerTime.setHours(hours, minutes, 0);
      
      // If the time has passed today, schedule for tomorrow
      if (triggerTime <= now) {
        triggerTime.setDate(triggerTime.getDate() + 1);
      }
      
      // Samsung devices sometimes need extra parameters for reliable notifications
      let soundName = settings.selectedRingtone;
      if (soundName === 'default') {
        soundName = 'notification';  // Fallback to standard notification sound
      }
      
      // Schedule with improved options for Samsung devices
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 100,
            title: "Workout Reminder",
            body: "It's time for your workout! Stay on track with your fitness goals.",
            schedule: { 
              at: triggerTime,
              repeats: true,
              every: 'day',
              allowWhileIdle: true,  // Allow notification even when device is idle
              count: 1  // Number of times to repeat notification if missed
            },
            sound: soundName,
            ongoing: false,
            autoCancel: true,
            channelId: "workout-reminders",
            smallIcon: "ic_stat_notification",
            largeIcon: "ic_stat_notification",
            importance: 4,  // HIGH priority (Samsung needs higher priority)
            vibration: settings.vibrationEnabled,
            actionTypeId: "",
            extra: {
              channelName: "Workout Reminders",
              priority: settings.notificationPriority
            }
          }
        ]
      });
      
      // Create a channel specifically for workout reminders (Samsung needs this)
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.createChannel({
          id: "workout-reminders",
          name: "Workout Reminders",
          description: "Notification channel for workout reminders",
          importance: 4,
          visibility: 1,
          sound: soundName,
          vibration: settings.vibrationEnabled,
          lights: true,
          lightColor: "#488AFF"
        });
      }
      
      // Trigger haptic feedback to confirm reminder set
      if (settings.vibrationEnabled && Haptics) {
        await Haptics.vibrate();
      }
      
      console.log('Reminder scheduled for', triggerTime, 'with sound', soundName);
    } catch (error) {
      console.error('Error scheduling reminder:', error);
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
