
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings } from '@/types';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// Default settings
const defaultSettings: AppSettings = {
  reminderEnabled: false,
  reminderTime: "07:00",
  voiceCuesEnabled: false,
  vibrationEnabled: true,
  dailyStepGoal: 5000
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

  useEffect(() => {
    // Load settings from localStorage
    const storedSettings = localStorage.getItem('fit-daily-settings');
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }

    // Initialize notifications if we're on a native platform
    if (Capacitor.isNativePlatform()) {
      initializeNotifications();
    }
  }, []);

  // Initialize notifications
  const initializeNotifications = async () => {
    try {
      const { display } = await LocalNotifications.checkPermissions();
      
      if (display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  // Update settings and save to localStorage
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('fit-daily-settings', JSON.stringify(updatedSettings));
    
    // Schedule reminder if enabled
    if (updatedSettings.reminderEnabled) {
      scheduleReminder();
    }
  };

  // Request notification permissions
  const setupNotificationPermissions = async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      console.log('Not on a native platform, simulating successful permission');
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

  // Schedule daily reminder
  const scheduleReminder = async (): Promise<void> => {
    if (!settings.reminderEnabled) return;
    
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
      
      // Schedule the notification
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 100,
            title: "Workout Reminder",
            body: "Don't forget your workout today!",
            schedule: { 
              at: triggerTime,
              repeats: true,
              every: 'day'
            },
            actionTypeId: "",
            extra: null
          }
        ]
      });
      
      console.log('Reminder scheduled for', triggerTime);
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
