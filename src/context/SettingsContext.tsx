
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
  checkNotificationPermissions
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
    // Initialize notifications
    await initLocalNotifications();
    
    // Import Haptics plugin
    if (Capacitor.isPluginAvailable('Haptics')) {
      try {
        const module = await import('@capacitor/haptics');
        Haptics = module.Haptics;
      } catch (error) {
        console.error('Error importing Haptics:', error);
      }
    }
    
    // Import App plugin
    if (Capacitor.isPluginAvailable('App')) {
      try {
        const module = await import('@capacitor/app');
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
        setupNotificationListeners();
      });
    } else {
      setPluginsLoaded(true);
    }
  }, []);

  // Listen for app state changes to recheck permissions and reschedule if needed
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !App) return;
    
    const setupAppListeners = async () => {
      // When app resumes from background
      await App.addListener('resume', () => {
        console.log('App resumed from background');
        
        // Verify if notification permissions are still granted
        checkNotificationPermissions().then(granted => {
          if (settings.reminderEnabled && granted) {
            // Reschedule reminders to ensure they're still active
            scheduleReminder();
          }
        });
      });
    };
    
    setupAppListeners();
    
    return () => {
      // Cleanup can be added here if needed
    };
  }, [pluginsLoaded, settings.reminderEnabled]);

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
    if (!Capacitor.isNativePlatform()) {
      console.log('Not on a native platform, simulating successful permission');
      return true;
    }

    return await requestNotificationPermissions();
  };

  // Schedule workout reminder with improved reliability
  const scheduleReminder = async (): Promise<void> => {
    if (!settings.reminderEnabled) return;
    
    try {
      // Schedule notification using our utility function
      await scheduleDailyNotification(
        settings.reminderTime,
        settings.weekdaysOnly,
        settings.selectedRingtone,
        settings.vibrationEnabled,
        settings.reminderDate
      );
      
      // Trigger haptic feedback to confirm reminder set
      if (settings.vibrationEnabled && Haptics) {
        await Haptics.vibrate();
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
