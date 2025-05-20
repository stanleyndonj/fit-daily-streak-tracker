
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings } from '@/types';
import { Capacitor } from '@capacitor/core';
import { format, isWeekend } from 'date-fns';
import { toast } from "sonner";
import {
  initLocalNotifications,
  requestNotificationPermissions,
  scheduleDailyNotification,
  setupNotificationListeners,
  checkNotificationPermissions,
  cancelAllNotifications
} from '@/utils/notificationUtils';

// Interface for Haptics plugin
interface HapticsPlugin {
  vibrate: () => Promise<void>;
}

// Interface for App plugin
interface AppPlugin {
  addListener: (eventName: string, callback: any) => Promise<any>;
  exitApp: () => Promise<void>;
}

// Import Haptics and App plugins conditionally
let Haptics: HapticsPlugin | undefined = undefined;
let App: AppPlugin | undefined = undefined;

// Dynamically import Capacitor plugins
const importCapacitorPlugins = async () => {
  if (Capacitor.isNativePlatform()) {
    console.log("Initializing Capacitor plugins...");
    
    // Initialize notifications
    await initLocalNotifications();
    
    // Import Haptics plugin
    if (Capacitor.isPluginAvailable('Haptics')) {
      try {
        const module = await import('@capacitor/haptics');
        Haptics = module.Haptics;
        console.log("Haptics plugin loaded successfully");
      } catch (error) {
        console.error('Error importing Haptics:', error);
      }
    }
    
    // Import App plugin
    if (Capacitor.isPluginAvailable('App')) {
      try {
        const module = await import('@capacitor/app');
        App = module.App;
        console.log("App plugin loaded successfully");
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
    console.log("SettingsProvider initializing...");
    
    if (Capacitor.isNativePlatform()) {
      importCapacitorPlugins().then(() => {
        setPluginsLoaded(true);
        setupNotificationListeners();
        console.log("Plugins loaded and setup complete");
      });
    } else {
      setPluginsLoaded(true);
      console.log("Not on native platform, skipping plugin initialization");
    }
  }, []);

  // Listen for app state changes to recheck permissions and reschedule if needed
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !App || !pluginsLoaded) return;
    
    const setupAppListeners = async () => {
      console.log("Setting up App state listeners...");
      
      // When app resumes from background
      await App.addListener('resume', () => {
        console.log('App resumed from background, checking notification permissions');
        
        // Verify if notification permissions are still granted
        checkNotificationPermissions().then(granted => {
          if (settings.reminderEnabled && granted) {
            console.log('App resumed: Permissions still granted, rescheduling reminders');
            // Reschedule reminders to ensure they're still active
            scheduleReminder();
          } else if (settings.reminderEnabled && !granted) {
            console.log('App resumed: Notification permissions lost');
            toast.error("Notification permissions are needed for reminders");
          }
        });
      });
    };
    
    setupAppListeners();
    
    return () => {
      // Cleanup can be added here if needed
      if (App) {
        console.log("Cleaning up App listeners");
        // App.removeAllListeners() would go here if available
      }
    };
  }, [pluginsLoaded, settings.reminderEnabled]);

  // Load settings from localStorage on component mount
  useEffect(() => {
    console.log("Loading settings from localStorage");
    const storedSettings = localStorage.getItem('fit-daily-settings');
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings(parsedSettings);
        console.log("Settings loaded:", parsedSettings);
      } catch (error) {
        console.error("Failed to parse stored settings:", error);
      }
    } else {
      console.log("No stored settings found, using defaults");
    }
  }, []);

  // Setup schedule when settings or plugins change
  useEffect(() => {
    if (pluginsLoaded && settings.reminderEnabled) {
      console.log("Settings updated, scheduling reminder");
      scheduleReminder();
    }
  }, [
    pluginsLoaded, 
    settings.reminderEnabled, 
    settings.reminderTime, 
    settings.reminderDate,
    settings.weekdaysOnly,
    settings.notifyInBackground,
    settings.selectedRingtone
  ]);

  // Update settings and save to localStorage
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    console.log("Updating settings:", newSettings);
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      localStorage.setItem('fit-daily-settings', JSON.stringify(updatedSettings));
      console.log("Settings saved to localStorage");
    } catch (error) {
      console.error("Failed to save settings to localStorage:", error);
      toast.error("Failed to save settings");
    }
    
    // If turning off reminders, cancel all pending notifications
    if (settings.reminderEnabled && newSettings.reminderEnabled === false) {
      cancelAllNotifications();
      console.log("Reminders turned off, cancelled all notifications");
    }
  };

  // Request notification permissions
  const setupNotificationPermissions = async (): Promise<boolean> => {
    console.log("Setting up notification permissions");
    if (!Capacitor.isNativePlatform()) {
      console.log('Not on a native platform, simulating successful permission');
      return true;
    }

    return await requestNotificationPermissions();
  };

  // Schedule workout reminder with improved reliability
  const scheduleReminder = async (): Promise<void> => {
    if (!settings.reminderEnabled) {
      console.log("Reminders not enabled, skipping scheduling");
      return;
    }
    
    console.log("Scheduling reminder with settings:", {
      time: settings.reminderTime,
      weekdaysOnly: settings.weekdaysOnly,
      ringtone: settings.selectedRingtone,
      vibration: settings.vibrationEnabled
    });
    
    try {
      // First check if we have permission
      const hasPermission = await checkNotificationPermissions();
      if (!hasPermission) {
        console.log("No notification permission, requesting now");
        const granted = await requestNotificationPermissions();
        if (!granted) {
          toast.error("Cannot schedule reminders without notification permission");
          return;
        }
      }
      
      // Schedule notification using our utility function
      const scheduled = await scheduleDailyNotification(
        settings.reminderTime,
        settings.weekdaysOnly,
        settings.selectedRingtone,
        settings.vibrationEnabled,
        settings.reminderDate
      );
      
      if (scheduled) {
        console.log("Reminder scheduled successfully");
        
        // Trigger haptic feedback to confirm reminder set
        if (settings.vibrationEnabled && Haptics) {
          await Haptics.vibrate();
          console.log("Haptic feedback triggered");
        }
      } else {
        console.error("Failed to schedule reminder");
      }
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
