
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings } from '@/types';
import { LocalNotifications } from '@capacitor/local-notifications';

// Default settings
const defaultSettings: AppSettings = {
  reminderEnabled: false,
  reminderTime: "07:00",
  voiceCuesEnabled: false,
  vibrationEnabled: true,
  dailyStepGoal: 5000
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (settings: AppSettings) => void;
  setupNotificationPermissions: () => Promise<boolean>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // Request notification permissions
  const setupNotificationPermissions = async (): Promise<boolean> => {
    try {
      const permResult = await LocalNotifications.requestPermissions();
      return permResult.display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  };

  // Schedule daily reminder notification
  const scheduleDailyReminder = async () => {
    if (!settings.reminderEnabled) return;
    
    try {
      // Parse reminder time
      const [hours, minutes] = settings.reminderTime.split(':').map(Number);
      
      // Calculate next trigger time
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0);
      
      // If time for today has passed, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      // Cancel any existing notifications
      await LocalNotifications.cancel({ notifications: [{ id: 2 }] });
      
      // Schedule the new notification
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 2,
            title: "Workout Reminder",
            body: "Don't forget your workout today!",
            schedule: { at: scheduledTime, repeats: true, every: 'day' },
            sound: null,
            actionTypeId: "",
            extra: null
          }
        ]
      });
      
      console.log('Reminder scheduled for:', scheduledTime);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('fit-daily-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    // Initialize notifications
    setupNotificationPermissions().then(granted => {
      if (granted) {
        scheduleDailyReminder();
      }
    });
  }, []);

  // Update settings and save to localStorage
  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('fit-daily-settings', JSON.stringify(newSettings));
    
    // Update reminder if changed
    if (newSettings.reminderEnabled !== settings.reminderEnabled ||
        newSettings.reminderTime !== settings.reminderTime) {
      scheduleDailyReminder();
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, setupNotificationPermissions }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
